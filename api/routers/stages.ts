import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { processStages, processes } from "@db/schema";
import {
  PAYWALL_ENABLED,
  STAGE_MAP,
  STAGES,
  type StageKey,
  type StageStatus,
} from "@contracts/constants";
import {
  getProcessByUser,
  getStagesByProcess,
  recordEvent,
  recordPaywallTrigger,
} from "./helpers";

const stageKeySchema = z.enum(
  STAGES.map((s) => s.key) as [StageKey, ...StageKey[]],
);
const stageStatusSchema = z.enum([
  "pending",
  "in_progress",
  "waiting_org",
  "waiting_user",
  "done",
  "blocked",
]);

function assertDependenciesMet(
  stageKey: StageKey,
  statusByKey: Map<string, StageStatus>,
): void {
  const def = STAGE_MAP[stageKey];
  const missing = def.dependsOn.filter((dep) => statusByKey.get(dep) !== "done");
  if (missing.length > 0) {
    const nomes = missing.map((m) => STAGE_MAP[m].title).join(", ");
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Etapa bloqueada — depende de: ${nomes}.`,
    });
  }
}

async function syncCurrentStage(processId: number): Promise<void> {
  const db = getDb();
  const rows = await getStagesByProcess(processId);
  const statusByKey = new Map(rows.map((r) => [r.stageKey, r.status as StageStatus]));
  const current = STAGES.find((s) => statusByKey.get(s.key) !== "done") ?? STAGES[STAGES.length - 1];
  await db
    .update(processes)
    .set({ currentStage: current.key })
    .where(eq(processes.id, processId));
}

export const stagesRouter = createRouter({
  /** Timeline com dependências calculadas e flags de paywall. */
  timeline: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const process = await getProcessByUser(ctx.user.id);
    if (!process) throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado." });
    const rows = await getStagesByProcess(process.id);
    const statusByKey = new Map(rows.map((r) => [r.stageKey, r.status as StageStatus]));
    const paywallEvent = await db.query.events.findFirst({
      where: (e, { and, eq }) => and(eq(e.userId, ctx.user.id), eq(e.kind, "paywall_triggered")),
    });
    const paid = process.paidAt !== null;
    return {
      processId: process.id,
      currentStage: process.currentStage,
      paidAt: process.paidAt,
      paywallTriggered: Boolean(paywallEvent),
      stages: STAGES.map((def) => {
        const status = statusByKey.get(def.key) ?? "pending";
        const deps = def.dependsOn.map((dep) => ({
          key: dep,
          title: STAGE_MAP[dep].title,
          done: statusByKey.get(dep) === "done",
        }));
        const blockedBy = deps.filter((d) => !d.done).map((d) => d.title);
        return {
          key: def.key,
          order: def.order,
          title: def.title,
          short: def.short,
          description: def.description,
          objetivo: def.objetivo,
          nossoPapel: def.nossoPapel,
          seuPapel: def.seuPapel,
          terminaQuando: def.terminaQuando,
          status,
          postGate: def.postGate,
          locked: def.postGate && !paid && PAYWALL_ENABLED, // cadeado visual no front
          dependsOn: deps,
          blockedBy,
        };
      }),
    };
  }),

  /**
   * Atualiza o status de uma etapa.
   * REGRA: etapa postGate com processes.paidAt null → PAYMENT_REQUIRED.
   * Respeita dependências (etapas anteriores precisam estar "done").
   */
  updateStage: authedQuery
    .input(z.object({ stageKey: stageKeySchema, status: stageStatusSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const process = await getProcessByUser(ctx.user.id);
      if (!process) throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado." });
      const def = STAGE_MAP[input.stageKey];
      // POC: com o paywall desligado (PAYWALL_ENABLED=false) a checagem é pulada.
      if (def.postGate && process.paidAt === null && PAYWALL_ENABLED) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "PAYMENT_REQUIRED",
        });
      }
      const rows = await getStagesByProcess(process.id);
      const statusByKey = new Map(rows.map((r) => [r.stageKey, r.status as StageStatus]));
      if (input.status !== "pending") {
        assertDependenciesMet(input.stageKey, statusByKey);
      }
      await db
        .update(processStages)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(
            eq(processStages.processId, process.id),
            eq(processStages.stageKey, input.stageKey),
          ),
        );
      await syncCurrentStage(process.id);
      await recordEvent(ctx.user.id, "stage_updated", {
        stageKey: input.stageKey,
        status: input.status,
      });
      return { ok: true };
    }),

  /**
   * Gatilho do paywall: chamado quando o usuário envia o 1º comprovante de
   * guia paga (docType em TAX_DOCTYPES). O dashboard passa a exibir o card de
   * pagamento a partir do evento.
   */
  triggerPaywall: authedQuery
    .input(z.object({ docType: z.string().optional() }).optional())
    .mutation(async ({ ctx }) => {
      const triggered = await recordPaywallTrigger(ctx.user.id);
      return { triggered };
    }),
});

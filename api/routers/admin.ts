import { z } from "zod";
import { and, desc, eq, inArray, isNotNull, like, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import {
  documents,
  leads,
  processes,
  processStages,
  profiles,
  users,
} from "@db/schema";
import {
  DOC_TYPE_MAP,
  PRICE_EXECUTION,
  STAGE_MAP,
  STAGES,
  UF_LIST,
  type StageKey,
  type StageStatus,
} from "@contracts/constants";
import { recordEvent } from "./helpers";
import { sendEmail, tplDocumentoAprovado, tplDocumentoRejeitado } from "../email";

const leadsFilterSchema = z.object({
  uf: z.enum(UF_LIST).optional(),
  status: z.enum(["new", "contacted", "converted", "lost"]).optional(),
  source: z.enum(["simulator", "quiz", "site"]).optional(),
  busca: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const adminRouter = createRouter({
  /** KPIs do funil: leads → cadastros → pagos. */
  kpis: adminQuery.query(async () => {
    const db = getDb();
    const [leadCount] = await db
      .select({ n: sql<number>`count(*)` })
      .from(leads);
    const [quizCount] = await db
      .select({ n: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.source, "quiz"));
    const [userCount] = await db
      .select({ n: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "user"));
    const [paidCount] = await db
      .select({ n: sql<number>`count(*)` })
      .from(processes)
      .where(isNotNull(processes.paidAt));
    const [pendingDocs] = await db
      .select({ n: sql<number>`count(*)` })
      .from(documents)
      .where(inArray(documents.status, ["pending", "in_review"]));
    const pagos = Number(paidCount.n);
    return {
      funil: {
        leads: Number(leadCount.n),
        preAnalises: Number(quizCount.n),
        cadastros: Number(userCount.n),
        pagos,
      },
      receita: pagos * PRICE_EXECUTION,
      documentosPendentes: Number(pendingDocs.n),
      ticket: PRICE_EXECUTION,
    };
  }),

  /** CRM de leads com filtros e busca. */
  leads: adminQuery.input(leadsFilterSchema).query(async ({ input }) => {
    const conds = [];
    if (input.uf) conds.push(eq(leads.uf, input.uf));
    if (input.status) conds.push(eq(leads.status, input.status));
    if (input.source) conds.push(eq(leads.source, input.source));
    if (input.busca) {
      const term = `%${input.busca}%`;
      conds.push(or(like(leads.name, term), like(leads.whatsapp, term)));
    }
    return getDb()
      .select()
      .from(leads)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(leads.createdAt))
      .limit(input.limit)
      .offset(input.offset);
  }),

  /** Exportação CSV com coluna Indicação. */
  leadsCsv: adminQuery
    .input(leadsFilterSchema.omit({ limit: true, offset: true }))
    .query(async ({ input }) => {
      const conds = [];
      if (input.uf) conds.push(eq(leads.uf, input.uf));
      if (input.status) conds.push(eq(leads.status, input.status));
      if (input.source) conds.push(eq(leads.source, input.source));
      if (input.busca) {
        const term = `%${input.busca}%`;
        conds.push(or(like(leads.name, term), like(leads.whatsapp, term)));
      }
      const rows = await getDb()
        .select()
        .from(leads)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(leads.createdAt))
        .limit(5000);
      const header = ["Nome", "WhatsApp", "UF", "Origem", "Status", "Indicação", "Criado em"];
      const lines = rows.map((l) =>
        [
          l.name,
          l.whatsapp,
          l.uf ?? "",
          l.source,
          l.status,
          l.referredBy ?? "",
          l.createdAt.toISOString(),
        ]
          .map(csvEscape)
          .join(";"),
      );
      return { filename: `leads-${new Date().toISOString().slice(0, 10)}.csv`, csv: [header.join(";"), ...lines].join("\n") };
    }),

  /** Kanban de processos agrupado por stageKey. */
  processes: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: processes.id,
        userId: processes.userId,
        uf: processes.uf,
        currentStage: processes.currentStage,
        paidAt: processes.paidAt,
        createdAt: processes.createdAt,
        name: users.name,
        email: users.email,
      })
      .from(processes)
      .innerJoin(users, eq(users.id, processes.userId));
    const columns = STAGES.map((s) => ({
      stageKey: s.key,
      title: s.short,
      cards: rows
        .filter((r) => r.currentStage === s.key)
        .map((r) => ({ ...r, daysInStage: null as number | null })),
    }));
    return { columns, total: rows.length };
  }),

  /** Move um processo de etapa (mesmas dependências; admin ignora paywall). */
  updateProcessStage: adminQuery
    .input(
      z.object({
        processId: z.number().int().positive(),
        stageKey: z.enum(STAGES.map((s) => s.key) as [StageKey, ...StageKey[]]),
        status: z.enum(["pending", "in_progress", "waiting_org", "waiting_user", "done", "blocked"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const process = await db.query.processes.findFirst({
        where: eq(processes.id, input.processId),
      });
      if (!process) throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado." });
      const rows = await db.query.processStages.findMany({
        where: eq(processStages.processId, input.processId),
      });
      const statusByKey = new Map(rows.map((r) => [r.stageKey, r.status as StageStatus]));
      const def = STAGE_MAP[input.stageKey];
      if (input.status !== "pending") {
        const missing = def.dependsOn.filter((dep) => statusByKey.get(dep) !== "done");
        if (missing.length > 0) {
          const nomes = missing.map((m) => STAGE_MAP[m].title).join(", ");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Etapa bloqueada — depende de: ${nomes}.`,
          });
        }
      }
      await db
        .update(processStages)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(
            eq(processStages.processId, input.processId),
            eq(processStages.stageKey, input.stageKey),
          ),
        );
      // recalcula currentStage
      const refreshed = await db.query.processStages.findMany({
        where: eq(processStages.processId, input.processId),
      });
      const byKey = new Map(refreshed.map((r) => [r.stageKey, r.status]));
      const current =
        STAGES.find((s) => byKey.get(s.key) !== "done") ?? STAGES[STAGES.length - 1];
      await db
        .update(processes)
        .set({ currentStage: current.key })
        .where(eq(processes.id, input.processId));
      await recordEvent(process.userId, "stage_updated", {
        stageKey: input.stageKey,
        status: input.status,
        by: "admin",
      });
      await recordEvent(ctx.user.id, "admin_stage_updated", {
        processId: input.processId,
        stageKey: input.stageKey,
        status: input.status,
      });
      return { ok: true };
    }),

  /** Fila de revisão: documentos pendentes/em revisão. */
  reviewQueue: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: documents.id,
        userId: documents.userId,
        docType: documents.docType,
        fileName: documents.fileName,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        status: documents.status,
        ocrStatus: documents.ocrStatus,
        ocrSummary: documents.ocrSummary,
        version: documents.version,
        createdAt: documents.createdAt,
        userName: users.name,
        userEmail: users.email,
        uf: profiles.uf,
      })
      .from(documents)
      .innerJoin(users, eq(users.id, documents.userId))
      .leftJoin(profiles, eq(profiles.userId, documents.userId))
      .where(inArray(documents.status, ["pending", "in_review"]))
      .orderBy(documents.createdAt);
    return rows.map((r) => ({ ...r, label: DOC_TYPE_MAP[r.docType]?.label ?? r.docType }));
  }),

  /** Aprova ou rejeita (motivo obrigatório) + e-mail automático. */
  reviewDocument: adminQuery
    .input(
      z.object({
        documentId: z.number().int().positive(),
        decision: z.enum(["approve", "reject"]),
        rejectionReason: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.decision === "reject" && !input.rejectionReason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Informe o motivo da rejeição — é o texto que o cliente vai ler.",
        });
      }
      const db = getDb();
      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, input.documentId),
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado." });
      const owner = await db.query.users.findFirst({ where: eq(users.id, doc.userId) });
      const status = input.decision === "approve" ? "approved" : "rejected";
      await db
        .update(documents)
        .set({
          status,
          rejectionReason: input.decision === "reject" ? input.rejectionReason! : null,
        })
        .where(eq(documents.id, doc.id));
      await recordEvent(doc.userId, input.decision === "approve" ? "document_approved" : "document_rejected", {
        docType: doc.docType,
        reason: input.rejectionReason ?? null,
      });
      await recordEvent(ctx.user.id, "admin_document_reviewed", {
        documentId: doc.id,
        decision: input.decision,
      });
      if (owner) {
        const label = DOC_TYPE_MAP[doc.docType]?.label ?? doc.docType;
        const tpl =
          input.decision === "approve"
            ? tplDocumentoAprovado(owner.name, label)
            : tplDocumentoRejeitado(owner.name, label, input.rejectionReason!);
        void sendEmail({ to: owner.email, subject: tpl.subject, html: tpl.html });
      }
      return { ok: true, status };
    }),

  /** Preview do blob para a fila de revisão (admin). */
  getDocument: adminQuery
    .input(z.object({ documentId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const doc = await getDb().query.documents.findFirst({
        where: eq(documents.id, input.documentId),
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado." });
      return {
        id: doc.id,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        version: doc.version,
        dataBase64: Buffer.from(doc.data).toString("base64"),
      };
    }),
});

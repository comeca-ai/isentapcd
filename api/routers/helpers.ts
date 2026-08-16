import { eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { events, processes, processStages } from "@db/schema";
import { STAGES } from "@contracts/constants";

export async function recordEvent(
  userId: number,
  kind: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  await getDb().insert(events).values({ userId, kind, payload: payload ?? null });
}

/** Cria o processo do usuário com as 7 etapas iniciais. */
export async function createProcessForUser(userId: number, uf?: string | null): Promise<number> {
  const db = getDb();
  const [{ id }] = await db
    .insert(processes)
    .values({ userId, uf: uf ?? null, currentStage: "descoberta" })
    .$returningId();
  await db.insert(processStages).values(
    STAGES.map((s) => ({
      processId: id,
      stageKey: s.key,
      status: s.order === 1 ? ("in_progress" as const) : ("pending" as const),
    })),
  );
  return id;
}

export async function getProcessByUser(userId: number) {
  return getDb().query.processes.findFirst({ where: eq(processes.userId, userId) });
}

export async function getStagesByProcess(processId: number) {
  return getDb().query.processStages.findMany({ where: eq(processStages.processId, processId) });
}

/**
 * Marca uma etapa como "done" para o processo do usuário (sem violar deps —
 * usado para conclusões automáticas, ex.: quiz concluído ⇒ "descoberta" done)
 * e recalcula currentStage. Não faz nada se a etapa já estiver done.
 */
export async function markStageDoneForUser(userId: number, stageKey: string) {
  const db = getDb();
  const process = await getProcessByUser(userId);
  if (!process) return;
  const rows = await getStagesByProcess(process.id);
  const current = rows.find((r) => r.stageKey === stageKey);
  if (!current || current.status === "done") return;
  await db
    .update(processStages)
    .set({ status: "done", updatedAt: new Date() })
    .where(eq(processStages.id, current.id));
  const byKey = new Map(
    rows.map((r) => [r.stageKey, r.stageKey === stageKey ? "done" : r.status]),
  );
  const next = STAGES.find((s) => byKey.get(s.key) !== "done") ?? STAGES[STAGES.length - 1];
  await db.update(processes).set({ currentStage: next.key }).where(eq(processes.id, process.id));
}

export function publicUser(u: { id: number; email: string; name: string; role: "user" | "admin"; createdAt: Date }) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt };
}

/**
 * Marca o gatilho do paywall (1º comprovante de guia paga enviado).
 * Idempotente: só registra o evento na primeira vez.
 */
export async function recordPaywallTrigger(userId: number): Promise<boolean> {
  const db = getDb();
  const existing = await db.query.events.findFirst({
    where: (e, { and, eq }) => and(eq(e.userId, userId), eq(e.kind, "paywall_triggered")),
  });
  if (existing) return false;
  await recordEvent(userId, "paywall_triggered");
  return true;
}

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

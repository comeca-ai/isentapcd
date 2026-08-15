import { isNotNull } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { emailReminders, profiles, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { UF_MATRIX, type Uf } from "@contracts/constants";
import { sendEmail, tplLembretePrazo } from "./email";

/**
 * Scheduler de lembretes (dossiê §4 — prazos pós-compra de IPVA por UF e
 * licenciamento anual por final de placa). Roda 1× ao boot (após 60s) e a cada
 * 24h. Dedup via UNIQUE(userId, kind, refKey) em email_reminders — nunca repete.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// Mês de vencimento do licenciamento por final de placa (padrão nacional Detran)
const PLATE_MONTH: Record<number, number> = {
  1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 11, 0: 12,
};

function todayAtMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseDateOnly(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Insere o marcador; retorna true se era inédito (deve enviar). */
async function claimReminder(userId: number, kind: string, refKey: string): Promise<boolean> {
  try {
    await getDb().insert(emailReminders).values({ userId, kind, refKey });
    return true;
  } catch (err: unknown) {
    // ER_DUP_ENTRY (MySQL/TiDB 1062) → já enviado
    if (err && typeof err === "object" && (err as { code?: string }).code === "ER_DUP_ENTRY") {
      return false;
    }
    const msg = String((err as Error)?.message ?? err);
    if (msg.includes("Duplicate entry")) return false;
    throw err;
  }
}

async function maybeSend(
  userId: number,
  email: string,
  name: string,
  kind: string,
  refKey: string,
  titulo: string,
  detalhe: string,
): Promise<void> {
  const fresh = await claimReminder(userId, kind, refKey);
  if (!fresh) return;
  const tpl = tplLembretePrazo(name, titulo, detalhe);
  await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
  console.log(`[scheduler] lembrete enviado: ${kind}/${refKey} → ${email}`);
}

export async function runReminderPass(): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({
      userId: profiles.userId,
      uf: profiles.uf,
      purchaseDate: profiles.purchaseDate,
      plateFinalDigit: profiles.plateFinalDigit,
      email: users.email,
      name: users.name,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(isNotNull(profiles.purchaseDate));

  const today = todayAtMidnight();

  for (const row of rows) {
    const purchase = parseDateOnly(row.purchaseDate);
    if (!purchase) continue;
    const uf = row.uf as Uf | null;

    // 1) Prazo de IPVA pós-compra (UF_MATRIX[uf].ipva.prazoPosCompraDias)
    if (uf && UF_MATRIX[uf]?.ipva.prazoPosCompraDias) {
      const days = UF_MATRIX[uf].ipva.prazoPosCompraDias!;
      const deadline = new Date(purchase.getTime() + days * DAY_MS);
      const daysLeft = Math.round((deadline.getTime() - today.getTime()) / DAY_MS);
      const dateStr = deadline.toLocaleDateString("pt-BR");
      const purchaseKey = row.purchaseDate!.toString().slice(0, 10);
      for (const milestone of [7, 1]) {
        if (daysLeft === milestone) {
          await maybeSend(
            row.userId,
            row.email,
            row.name,
            "ipva_pos_compra",
            `${purchaseKey}-d${milestone}`,
            `Prazo de IPVA pós-compra em ${uf}`,
            `o prazo para pedir a isenção de IPVA no seu estado vence em ${milestone === 1 ? "1 dia" : "7 dias"} (${dateStr}). Protocole no portal do Detran/Sefaz de ${uf} quanto antes.`,
          );
        }
      }
    }

    // 2) Licenciamento anual por final de placa
    if (row.plateFinalDigit !== null && row.plateFinalDigit !== undefined) {
      const month = PLATE_MONTH[row.plateFinalDigit];
      if (month) {
        const year =
          today.getMonth() + 1 <= month ? today.getFullYear() : today.getFullYear() + 1;
        const firstOfMonth = new Date(year, month - 1, 1);
        const daysToMonth = Math.round((firstOfMonth.getTime() - today.getTime()) / DAY_MS);
        // Avisa 30 dias antes e no 1º dia do mês de vencimento
        if (daysToMonth === 30 || daysToMonth === 0) {
          await maybeSend(
            row.userId,
            row.email,
            row.name,
            "licenciamento_anual",
            `${year}-placa${row.plateFinalDigit}-d${daysToMonth}`,
            `Licenciamento ${year} — final de placa ${row.plateFinalDigit}`,
            `o licenciamento do seu carro (final de placa ${row.plateFinalDigit}) vence no mês ${String(month).padStart(2, "0")}/${year}. Verifique também se a sua UF exige renovação anual da isenção de IPVA.`,
          );
        }
      }
    }
  }
}

let started = false;

export function startScheduler(): void {
  if (started) return;
  started = true;
  const safe = () =>
    runReminderPass().catch((err) => console.error("[scheduler] falha na passada:", err));
  setTimeout(safe, 60_000); // primeira passada após 60s
  setInterval(safe, 24 * 60 * 60 * 1000); // depois a cada 24h
  console.log("[scheduler] lembretes agendados (primeira passada em 60s, depois a cada 24h)");
}

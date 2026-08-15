import { eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { hashPassword } from "./password";
import { authEnv } from "./env";

/**
 * Bootstrap do admin no boot: cria role=admin a partir de
 * ADMIN_EMAIL/ADMIN_PASSWORD se ainda não existir.
 */
export async function ensureAdminUser(): Promise<void> {
  if (!authEnv.adminEmail || !authEnv.adminPassword) {
    console.log("[auth] ADMIN_EMAIL/ADMIN_PASSWORD não definidos — bootstrap de admin pulado");
    return;
  }
  const email = authEnv.adminEmail.toLowerCase();
  const db = getDb();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    if (existing.role !== "admin") {
      await db.update(users).set({ role: "admin" }).where(eq(users.id, existing.id));
      console.log(`[auth] admin promovido: ${email}`);
    }
    return;
  }
  const passwordHash = await hashPassword(authEnv.adminPassword);
  await db.insert(users).values({ email, name: "Administrador", passwordHash, role: "admin" });
  console.log(`[auth] admin criado no boot: ${email}`);
}

import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { eq } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { users, type User } from "@db/schema";
import { readCookie } from "./auth/cookies";
import { verifySession } from "./auth/jwt";
import { authEnv, SESSION_COOKIE } from "./auth/env";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User; // presente quando o cookie de sessão JWT é válido
};

async function loadUser(req: Request): Promise<User | undefined> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return undefined;
  const payload = verifySession(token);
  if (!payload) return undefined;
  try {
    const user = await getDb().query.users.findFirst({ where: eq(users.id, payload.sub) });
    return user ?? undefined;
  } catch {
    return undefined; // DB indisponível não deve derrubar rotas públicas
  }
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const base = { req: opts.req, resHeaders: opts.resHeaders };
  // Sem segredo configurado (dev sem .env completo) não há sessão possível
  if (!authEnv.jwtSecret) return base;
  const user = await loadUser(opts.req);
  return { ...base, user };
}

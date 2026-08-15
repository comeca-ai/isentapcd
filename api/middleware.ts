import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

/** Exige usuário autenticado (cookie JWT válido). */
export const authedQuery = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para continuar." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** Exige usuário autenticado com role=admin. */
export const adminQuery = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para continuar." });
  }
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito à equipe." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { hashPassword, verifyPassword } from "../auth/password";
import { signSession } from "../auth/jwt";
import { setSessionCookie, clearSessionCookie } from "../auth/cookies";
import { allowLoginAttempt, clientIp, resetLoginAttempts } from "../auth/rateLimit";
import { sendEmail, tplBoasVindas } from "../email";
import { createProcessForUser, publicUser, recordEvent } from "./helpers";

const emailSchema = z.string().trim().toLowerCase().email("E-mail inválido");
const passwordSchema = z
  .string()
  .min(8, "A senha precisa de pelo menos 8 caracteres")
  .max(72, "A senha é longa demais");

export const authRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        email: emailSchema,
        password: passwordSchema,
        name: z.string().trim().min(2, "Informe seu nome"),
        referredBy: z.string().trim().max(255).optional(),
        uf: z.string().length(2).toUpperCase().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Já existe uma conta com este e-mail." });
      }
      const passwordHash = await hashPassword(input.password);
      const [{ id }] = await db
        .insert(users)
        .values({
          email: input.email,
          name: input.name,
          passwordHash,
          referredBy: input.referredBy ?? null,
        })
        .$returningId();
      await createProcessForUser(id, input.uf ?? null);
      await recordEvent(id, "user_registered", { source: "site" });
      const user = await db.query.users.findFirst({ where: eq(users.id, id) });
      const token = signSession({ sub: id, email: input.email, role: "user" });
      setSessionCookie(ctx.resHeaders, token);
      const tpl = tplBoasVindas(input.name);
      void sendEmail({ to: input.email, subject: tpl.subject, html: tpl.html });
      return { user: publicUser(user!) };
    }),

  login: publicQuery
    .input(z.object({ email: emailSchema, password: z.string().min(1, "Informe a senha") }))
    .mutation(async ({ ctx, input }) => {
      const ip = clientIp(ctx.req);
      if (!allowLoginAttempt(ip, input.email)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Muitas tentativas. Aguarde 15 minutos e tente de novo.",
        });
      }
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.email, input.email) });
      const ok = user ? await verifyPassword(input.password, user.passwordHash) : false;
      if (!user || !ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
      }
      resetLoginAttempts(ip, input.email);
      const token = signSession({ sub: user.id, email: user.email, role: user.role });
      setSessionCookie(ctx.resHeaders, token);
      await recordEvent(user.id, "user_login");
      return { user: publicUser(user) };
    }),

  logout: publicQuery.mutation(({ ctx }) => {
    clearSessionCookie(ctx.resHeaders);
    return { ok: true };
  }),

  me: authedQuery.query(({ ctx }) => ({ user: publicUser(ctx.user) })),

  changePassword: authedQuery
    .input(z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema }))
    .mutation(async ({ ctx, input }) => {
      const ok = await verifyPassword(input.currentPassword, ctx.user.passwordHash);
      if (!ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta." });
      }
      const passwordHash = await hashPassword(input.newPassword);
      await getDb().update(users).set({ passwordHash }).where(eq(users.id, ctx.user.id));
      await recordEvent(ctx.user.id, "password_changed");
      return { ok: true };
    }),

  updateName: authedQuery
    .input(z.object({ name: z.string().trim().min(2, "Informe seu nome") }))
    .mutation(async ({ ctx, input }) => {
      await getDb().update(users).set({ name: input.name }).where(eq(users.id, ctx.user.id));
      return { ok: true, name: input.name };
    }),
});

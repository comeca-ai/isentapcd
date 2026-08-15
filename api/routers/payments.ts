import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { processes, users } from "@db/schema";
import { PRICE_EXECUTION, REFERRAL_REWARD } from "@contracts/constants";
import { getProcessByUser, recordEvent } from "./helpers";
import { sendEmail, tplPagamentoConfirmado } from "../email";

export const paymentsRouter = createRouter({
  /** Status de pagamento do usuário logado. */
  status: authedQuery.query(async ({ ctx }) => {
    const process = await getProcessByUser(ctx.user.id);
    const hasReferral = Boolean(ctx.user.referredBy);
    return {
      paidAt: process?.paidAt ?? null,
      price: PRICE_EXECUTION,
      referralReward: REFERRAL_REWARD,
      referralDiscount: hasReferral ? REFERRAL_REWARD : 0,
      finalPrice: hasReferral ? PRICE_EXECUTION - REFERRAL_REWARD : PRICE_EXECUTION,
    };
  }),

  /** Admin: confirma pagamento (inclusive vendas fechadas no WhatsApp). */
  adminConfirm: adminQuery
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const target = await db.query.users.findFirst({ where: eq(users.id, input.userId) });
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado." });
      const process = await getProcessByUser(input.userId);
      if (!process) throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado." });
      if (process.paidAt) {
        throw new TRPCError({ code: "CONFLICT", message: "Pagamento já confirmado." });
      }
      const now = new Date();
      await db.update(processes).set({ paidAt: now }).where(eq(processes.id, process.id));
      await recordEvent(input.userId, "payment_confirmed", {
        confirmedBy: ctx.user.id,
        amount: PRICE_EXECUTION,
      });
      await recordEvent(ctx.user.id, "admin_payment_confirmed", { userId: input.userId });
      const tpl = tplPagamentoConfirmado(target.name);
      void sendEmail({ to: target.email, subject: tpl.subject, html: tpl.html });
      return { ok: true, paidAt: now };
    }),

  /** Admin: estorno — limpa paidAt e re-trava etapas postGate. */
  adminRefund: adminQuery
    .input(
      z.object({
        userId: z.number().int().positive(),
        motivo: z.string().trim().min(3, "Informe o motivo do estorno"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const process = await getProcessByUser(input.userId);
      if (!process) throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado." });
      if (!process.paidAt) {
        throw new TRPCError({ code: "CONFLICT", message: "Este usuário não tem pagamento ativo." });
      }
      await db.update(processes).set({ paidAt: null }).where(eq(processes.id, process.id));
      await recordEvent(input.userId, "payment_refunded", {
        refundedBy: ctx.user.id,
        motivo: input.motivo,
      });
      await recordEvent(ctx.user.id, "admin_payment_refunded", {
        userId: input.userId,
        motivo: input.motivo,
      });
      return { ok: true };
    }),
});

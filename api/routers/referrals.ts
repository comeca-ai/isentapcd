import { inArray } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { leads, profiles, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { PRICE_EXECUTION, REFERRAL_REWARD } from "@contracts/constants";

export const referralsRouter = createRouter({
  /**
   * Indicações do usuário: users.referredBy + leads.referredBy que casam com
   * nome, e-mail ou telefone do usuário.
   */
  myReferrals: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, ctx.user.id),
    });
    const keys = [ctx.user.name, ctx.user.email, profile?.telefone].filter(
      (k): k is string => Boolean(k),
    );
    if (keys.length === 0) {
      return { indicados: [], total: 0, convertidos: 0, recompensa: REFERRAL_REWARD };
    }
    const [refUsers, refLeads] = await Promise.all([
      db
        .select({ id: users.id, name: users.name, createdAt: users.createdAt })
        .from(users)
        .where(inArray(users.referredBy, keys)),
      db
        .select({
          id: leads.id,
          name: leads.name,
          status: leads.status,
          source: leads.source,
          createdAt: leads.createdAt,
        })
        .from(leads)
        .where(inArray(leads.referredBy, keys)),
    ]);
    const indicados = [
      ...refUsers.map((u) => ({
        kind: "cadastro" as const,
        name: u.name,
        status: "convertido" as const,
        createdAt: u.createdAt,
      })),
      ...refLeads.map((l) => ({
        kind: "lead" as const,
        name: l.name,
        status: l.status,
        createdAt: l.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const convertidos =
      refUsers.length + refLeads.filter((l) => l.status === "converted").length;
    return {
      indicados,
      total: indicados.length,
      convertidos,
      recompensa: REFERRAL_REWARD,
      descontoAcumulado: convertidos * REFERRAL_REWARD,
    };
  }),

  /** Texto pronto para compartilhar no WhatsApp. */
  shareText: authedQuery.query(({ ctx }) => {
    const first = ctx.user.name.split(" ")[0];
    const text =
      `Oi! Eu usei o IsentaPCD para entender minhas isenções de IPI + ICMS + IPVA na compra do carro 0 km. ` +
      `Faz a pré-análise grátis em 2 minutos: https://isentapcd.com.br/pre-analise — ` +
      `se você fechar o acompanhamento, coloca que foi indicação minha (${ctx.user.name}) ` +
      `e eu ganho R$ ${REFERRAL_REWARD} de desconto. Abraço! — ${first}`;
    return {
      text,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(text)}`,
      reward: REFERRAL_REWARD,
      price: PRICE_EXECUTION,
    };
  }),
});

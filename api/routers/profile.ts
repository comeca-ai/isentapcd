import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { leads, profiles } from "@db/schema";
import { UF_LIST } from "@contracts/constants";
import { markStageDoneForUser, recordEvent } from "./helpers";
import { sendEmail, tplCadastroConcluido } from "../email";

const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().length(11, "CPF incompleto — são 11 dígitos"));
const cepSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().length(8, "CEP incompleto — são 8 dígitos"));

const step1Schema = z.object({
  step: z.literal(1),
  cpf: cpfSchema.optional(),
  telefone: z.string().trim().min(8).max(30).optional(),
  uf: z.enum(UF_LIST).optional(),
});

const step2Schema = z.object({
  step: z.literal(2),
  disabilityType: z
    .enum(["fisica", "visual", "auditiva", "intelectual", "tea", "multipla", "outra"])
    .optional(),
  isDriver: z.boolean().optional(),
  cnhSpecial: z.boolean().optional(),
  laudoInfo: z
    .object({
      temLaudo: z.enum(["recente", "antigo", "nenhum"]).optional(),
      cid: z.string().max(20).optional(),
      emissor: z.string().max(255).optional(),
      dataEmissao: z.string().max(10).optional(),
      teaNivel: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    })
    .optional(),
});

const condutorSchema = z.object({
  nome: z.string().trim().min(2),
  cpf: cpfSchema,
  parentesco: z.string().max(60).optional(),
  cnh: z.string().max(20).optional(),
});

const step3Schema = z.object({
  step: z.literal(3),
  condutoresInfo: z.object({
    condutores: z.array(condutorSchema).max(3, "No máximo 3 condutores autorizados"),
    representante: z
      .object({
        tipo: z.enum(["pai", "mae", "tutor", "curador"]),
        nome: z.string().trim().min(2),
        cpf: cpfSchema,
      })
      .nullable()
      .optional(),
  }),
});

const step4Schema = z.object({
  step: z.literal(4),
  intendedVehicleId: z.number().int().positive().nullable().optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato AAAA-MM-DD").optional(),
  plateFinalDigit: z.number().int().min(0).max(9).nullable().optional(),
  endereco: z
    .object({
      cep: cepSchema,
      logradouro: z.string().max(255).optional(),
      numero: z.string().max(20).optional(),
      complemento: z.string().max(120).optional(),
      bairro: z.string().max(120).optional(),
      cidade: z.string().max(120).optional(),
      uf: z.enum(UF_LIST).optional(),
    })
    .optional(),
});

const upsertSchema = z.discriminatedUnion("step", [
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
]);

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export const profileRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    const profile = await getDb().query.profiles.findFirst({
      where: eq(profiles.userId, ctx.user.id),
    });
    return profile ?? null;
  }),

  /** Salva uma etapa do cadastro (rascunho) — upsert por userId. */
  upsertStep: authedQuery.input(upsertSchema).mutation(async ({ ctx, input }) => {
    const { step, ...data } = input;
    const db = getDb();
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.userId, ctx.user.id),
    });
    const values = { ...data, formStep: Math.max(step, existing?.formStep ?? 0) };
    if (existing) {
      await db.update(profiles).set(values).where(eq(profiles.userId, ctx.user.id));
    } else {
      await db.insert(profiles).values({ userId: ctx.user.id, ...values });
    }
    // Backfill anti-arrasto: se o telefone bate com um lead de quiz/simulador
    // anterior ao cadastro, vincula o lead à conta e conclui a etapa "descoberta".
    if (step === 1 && "telefone" in data && typeof data.telefone === "string") {
      const digits = data.telefone.replace(/\D/g, "");
      if (digits.length >= 8) {
        const matched = await db
          .select({ id: leads.id, source: leads.source })
          .from(leads)
          .where(sql`REGEXP_REPLACE(${leads.whatsapp}, '[^0-9]', '') = ${digits}`)
          .limit(5);
        if (matched.length > 0) {
          await db
            .update(leads)
            .set({ userId: ctx.user.id })
            .where(sql`REGEXP_REPLACE(${leads.whatsapp}, '[^0-9]', '') = ${digits}`);
          if (matched.some((l) => l.source === "quiz")) {
            await markStageDoneForUser(ctx.user.id, "descoberta");
          }
        }
      }
    }
    return { ok: true, formStep: values.formStep };
  }),

  /** Proxy server-side para o ViaCEP (evita CORS e esconde a integração). */
  lookupCep: authedQuery
    .input(z.object({ cep: cepSchema }))
    .query(async ({ input }) => {
      const res = await fetch(`https://viacep.com.br/ws/${input.cep}/json/`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Serviço de CEP indisponível." });
      }
      const data = (await res.json()) as ViaCepResponse;
      if (data.erro) {
        throw new TRPCError({ code: "NOT_FOUND", message: "CEP não encontrado." });
      }
      return {
        cep: (data.cep ?? "").replace(/\D/g, ""),
        logradouro: data.logradouro ?? "",
        complemento: data.complemento ?? "",
        bairro: data.bairro ?? "",
        cidade: data.localidade ?? "",
        uf: data.uf ?? "",
      };
    }),

  /** Marca o cadastro como completo. */
  submit: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.userId, ctx.user.id),
    });
    if (!existing?.cpf || !existing.uf || !existing.disabilityType) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Complete CPF, UF e tipo de deficiência antes de confirmar o cadastro.",
      });
    }
    await db
      .update(profiles)
      .set({ completedAt: new Date(), formStep: 5 })
      .where(eq(profiles.userId, ctx.user.id));
    await recordEvent(ctx.user.id, "profile_completed");
    // E-mail gentil de cadastro concluído (Resend; no-op com log se sem chave)
    await sendEmail({ to: ctx.user.email, ...tplCadastroConcluido(ctx.user.name) });
    return { ok: true };
  }),
});

import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { leads } from "@db/schema";
import { UF_LIST } from "@contracts/constants";

export const leadsRouter = createRouter({
  /** Modal do simulador / site: captura nome + WhatsApp + consentimento LGPD. */
  capture: publicQuery
    .input(
      z.object({
        name: z.string().trim().min(2, "Informe seu nome"),
        whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido").max(30),
        lgpdConsent: z.literal(true, {
          error: "É preciso aceitar o uso dos dados (LGPD) para continuar.",
        }),
        referredBy: z.string().trim().max(255).optional(),
        uf: z.enum(UF_LIST).optional(),
        vehicleSlug: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [{ id }] = await getDb()
        .insert(leads)
        .values({
          name: input.name,
          whatsapp: input.whatsapp,
          lgpdConsent: input.lgpdConsent,
          source: "simulator",
          uf: input.uf ?? null,
          referredBy: input.referredBy ?? null,
          quizAnswers: input.vehicleSlug ? { vehicleSlug: input.vehicleSlug } : null,
        })
        .$returningId();
      return { leadId: id };
    }),
});

import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { vehicles } from "@db/schema";

export const vehiclesRouter = createRouter({
  list: publicQuery.query(async () => {
    const rows = await getDb().select().from(vehicles).orderBy(asc(vehicles.precoCentavos));
    return rows.map((v) => ({ ...v, preco: v.precoCentavos / 100 }));
  }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const v = await getDb().query.vehicles.findFirst({ where: eq(vehicles.slug, input.slug) });
      if (!v) throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado." });
      return { ...v, preco: v.precoCentavos / 100 };
    }),
});

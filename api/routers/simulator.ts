import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { vehicles } from "@db/schema";
import {
  FEDERAL,
  IPI_RATES_BY_FUEL,
  UF_LIST,
  UF_MATRIX,
  DISCLAIMER_SIMULADOR,
  type SimulationResult,
} from "@contracts/constants";

const inputSchema = z
  .object({
    vehicleId: z.number().int().positive().optional(),
    preco: z.number().positive().max(5_000_000).optional(),
    uf: z.enum(UF_LIST),
    combustivel: z.enum(["flex", "gasolina", "diesel", "eletrico", "hibrido"]).optional(),
    adaptacao: z.boolean().default(false),
    isDriver: z.boolean().default(true),
  })
  .refine((v) => v.vehicleId !== undefined || v.preco !== undefined, {
    message: "Informe vehicleId ou preco.",
  });

/**
 * Simulador 100% derivado de UF_MATRIX + FEDERAL (dossiê §2.7, §3, §4).
 */
export const simulatorRouter = createRouter({
  calculate: publicQuery.input(inputSchema).query(async ({ input }): Promise<SimulationResult> => {
    const ufRule = UF_MATRIX[input.uf];
    const warnings: string[] = [];
    let preco = input.preco;
    let combustivel = input.combustivel;

    if (input.vehicleId !== undefined) {
      const v = await getDb().query.vehicles.findFirst({ where: eq(vehicles.id, input.vehicleId) });
      if (!v) throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado." });
      preco = v.precoCentavos / 100;
      combustivel = combustivel ?? v.combustivel;
    }
    if (preco === undefined || combustivel === undefined) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Informe o preço e o combustível (ou um veículo do catálogo).",
      });
    }

    // ── IPI (federal) ──
    const aliquotaIpi = IPI_RATES_BY_FUEL[combustivel];
    const dentroTetoIpi = preco <= FEDERAL.IPI_CEILING;
    const ipiValor = dentroTetoIpi ? round2(preco * aliquotaIpi) : 0;
    if (!dentroTetoIpi) {
      warnings.push(
        `Acima do teto de IPI (R$ ${FEDERAL.IPI_CEILING.toLocaleString("pt-BR")}): sem isenção federal para este veículo.`,
      );
    }
    warnings.push(
      "Atenção (🟡): desde 04/2026 a LC 224/2025 reduziu benefícios federais; confirme o valor exato do IPI na cotação da concessionária.",
    );

    // ── ICMS (estadual) ──
    const icms = ufRule.icms;
    let icmsValor: number | null = null;
    let icmsTipo: "integral" | "parcial" | "nenhuma" | "verificar" = "verificar";
    if (!icms.existe || icms.tetoIntegral === null || icms.aliquota === null) {
      warnings.push(
        `ICMS em ${input.uf}: regra não cravada em fonte oficial — verifique com a Sefaz-${input.uf} antes de contar com esta economia.`,
      );
    } else if (preco <= icms.tetoIntegral) {
      icmsTipo = "integral";
      icmsValor = round2(preco * icms.aliquota);
    } else if (icms.tetoParcial !== null && preco <= icms.tetoParcial) {
      icmsTipo = "parcial";
      icmsValor = round2(icms.tetoIntegral * icms.aliquota); // isenção limitada à parcela
      warnings.push(
        `ICMS parcial: a isenção cobre só a parcela de R$ ${icms.tetoIntegral.toLocaleString("pt-BR")} — o restante paga normalmente.`,
      );
    } else {
      icmsTipo = "nenhuma";
      icmsValor = 0;
      warnings.push(
        `Acima do teto de ICMS de ${input.uf} (R$ ${(icms.tetoParcial ?? icms.tetoIntegral).toLocaleString("pt-BR")}): sem isenção estadual.`,
      );
    }

    // ── IPVA (estadual) ──
    const ipva = ufRule.ipva;
    let percentual: number | null = null;
    let ipvaDisclaimer =
      "IPVA do 1º ano pode ser cobrado proporcionalmente conforme a regra da sua UF — confirme o marco inicial com o Detran/Sefaz.";
    switch (ipva.tipo) {
      case "full":
        percentual = 1;
        if (ipva.teto !== null && preco > ipva.teto) {
          if (input.uf === "SP" && preco <= 120_000) {
            // SP (dossiê §4): 70 mil total / 120 mil parcial — paga sobre o excedente
            percentual = round2(70_000 / preco);
            ipvaDisclaimer +=
              " Em SP, entre R$ 70 mil e R$ 120 mil a isenção de IPVA é parcial: paga-se só sobre o excedente.";
          } else {
            percentual = 0;
            warnings.push(
              `IPVA em ${input.uf}: veículo acima do teto de R$ ${ipva.teto.toLocaleString("pt-BR")} — sem isenção.`,
            );
          }
        }
        break;
      case "partial":
        percentual = ipva.teto !== null && preco > ipva.teto ? 0 : null;
        ipvaDisclaimer += ` Em ${input.uf} o IPVA NÃO é zero: a isenção vale só para a parcela de R$ 70.000 (até R$ 120 mil).`;
        break;
      case "discount60":
        percentual = 0.6;
        ipvaDisclaimer += " Em MS o benefício é REDUÇÃO de 60% no IPVA — não é isenção total.";
        break;
      case "restricted":
        percentual = null;
        ipvaDisclaimer += ` Em ${input.uf} o IPVA tem regra restrita em 2026 — verifique o rol vigente com a Sefaz.`;
        break;
      case "none":
        percentual = 0;
        break;
      case "unknown":
        percentual = null;
        ipvaDisclaimer += ` A regra de IPVA de ${input.uf} não está cravada em fonte oficial — verifique com a Sefaz-${input.uf}.`;
        break;
    }

    // ── Warnings de confiança / armadilhas ──
    if (ufRule.confidence === "check_org") {
      warnings.push(
        `${input.uf} tem lacunas na fonte oficial — confirme as regras com o órgão antes de comprar.`,
      );
    }
    for (const item of ufRule.verificarComOrgao) {
      warnings.push(`Verificar com o órgão (${input.uf}): ${item}.`);
    }
    if (input.uf === "RJ") {
      warnings.push("RJ: teto de IPVA de R$ 55 mil praticamente exclui carro 0 km nacional.");
    }
    if (input.uf === "MS") warnings.push("MS: IPVA é só redução de 60% — nunca 'IPVA zero'.");
    if (input.uf === "TO") warnings.push("TO: IPVA é parcial — isenção só na parcela de R$ 70 mil.");

    const total =
      icmsValor === null ? null : round2(ipiValor + icmsValor); // IPVA é anual e não entra no total da compra

    return {
      preco,
      uf: input.uf,
      breakdown: {
        ipi: { aliquota: aliquotaIpi, valor: ipiValor, isento: dentroTetoIpi, teto: FEDERAL.IPI_CEILING },
        icms: {
          aliquota: icms.aliquota,
          valor: icmsValor,
          tipo: icmsTipo,
          tetoIntegral: icms.tetoIntegral,
          tetoParcial: icms.tetoParcial,
        },
        ipva: {
          tipo: ipva.tipo,
          teto: ipva.teto,
          percentualIsencao: percentual,
          disclaimer: ipvaDisclaimer,
        },
        total,
      },
      confidence: ufRule.confidence,
      warnings: [...warnings, DISCLAIMER_SIMULADOR],
    };
  }),
});

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

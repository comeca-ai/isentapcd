import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { leads } from "@db/schema";
import {
  UF_LIST,
  FEDERAL,
  type EligibilityResult,
  type QuizAnswers,
} from "@contracts/constants";

const answersSchema = z.object({
  paraQuem: z.enum(["eu_condutor", "eu_nao_condutor", "filho_dependente", "outro_familiar"]),
  uf: z.enum(UF_LIST),
  disabilityType: z.enum(["fisica", "visual", "auditiva", "intelectual", "tea", "multipla", "outra"]),
  teaSupportLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal("nao_sei")]).optional(),
  visaoMonocular: z.boolean().optional(),
  cnhRestriction: z.enum(["sim", "nao", "sem_cnh_especial"]).optional(),
  quemDirige: z.enum(["eu_familiar", "outra_pessoa", "mais_de_uma"]).optional(),
  laudoStatus: z.enum(["recente", "antigo", "nenhum"]),
  carroExistente: z.enum(["nenhum", "com_isencao", "sem_isencao"]),
  tempoIsencao: z.enum(["menos2", "de2a4", "mais4"]).optional(),
  debitos: z.enum(["nao", "sim", "nao_sei"]),
  faixaPreco: z.enum(["ate70", "70a120", "120a200", "nao_sei"]),
  quandoComprar: z.enum(["3meses", "3a6meses", "pesquisando"]).optional(),
});

const contatoSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido").max(30),
  lgpdConsent: z.literal(true, { error: "É preciso aceitar o uso dos dados (LGPD) para continuar." }),
  referredBy: z.string().trim().max(255).optional(),
});

/**
 * Avaliação de elegibilidade — regras do dossiê regulatório (§2.1, §2.5, §3, §8).
 */
export function evaluateEligibility(a: QuizAnswers): EligibilityResult {
  const pendencias: string[] = [];
  const warnings: string[] = [];
  let inegavel = false;

  // Tipo de deficiência (Lei 8.989/95, art. 1º, IV + Decreto 11.063/2022)
  if (a.disabilityType === "outra") {
    pendencias.push(
      "Seu tipo de deficiência não está na lista principal — o enquadramento depende de laudo com conclusão funcional. Como resolver: fale com a gente para avaliação individual do seu caso.",
    );
  }
  if (a.disabilityType === "intelectual") {
    pendencias.push(
      "Deficiência intelectual: em 2026 o IPI federal exige grau severo ou profundo (CID-10). O STF derrubou o filtro de grau apenas no regime 2027+. Como resolver: confirme o grau no laudo antes de protocolar.",
    );
  }
  if (a.disabilityType === "tea") {
    if (a.teaSupportLevel === 1 || a.teaSupportLevel === "nao_sei") {
      pendencias.push(
        "Autismo: em 2026 a Receita costuma exigir laudo com CID F84.0/F84.1 e descrição funcional; nível 1 pode ser negado no administrativo (o STF garantiu sem filtro de grau só a partir de 2027). Como resolver: laudo completo médico + psicólogo — e, se negado, seu caso é judicializável.",
      );
    } else {
      warnings.push("TEA: o laudo precisa ser assinado por médico E psicólogo em conjunto.");
    }
  }
  if (a.visaoMonocular) {
    pendencias.push(
      "Visão monocular: a Receita nega no administrativo, mas o STJ já garante IPI e ICMS na Justiça. Como resolver: trate como provável via judicial — explicamos o caminho no seu mapa.",
    );
  }

  // Laudo
  if (a.laudoStatus === "nenhum") {
    pendencias.push(
      "Você ainda não tem laudo médico. Como resolver: seu mapa mostra como conseguir de graça no SUS ou em clínica credenciada ao Detran — laudo particular puro não vale no administrativo.",
    );
    if (a.disabilityType === "outra") inegavel = true;
  } else if (a.laudoStatus === "antigo") {
    pendencias.push(
      "Seu laudo é antigo — acima de 12 meses costuma gerar exigência. Como resolver: peça uma atualização com CID e conclusão funcional.",
    );
  }

  // Débitos (cláusula 1ª, §3º, Conv. 38/12)
  if (a.debitos === "sim") {
    pendencias.push(
      "Débitos em aberto (IPVA/multas) bloqueiam o pedido de ICMS em todas as UFs. Como resolver: quite ou parcele antes de protocolar — incluímos o passo a passo no mapa.",
    );
  } else if (a.debitos === "nao_sei") {
    pendencias.push(
      "É preciso confirmar se há débitos de IPVA/multas no CPF da pessoa com deficiência. Como resolver: seu mapa mostra onde consultar de graça.",
    );
  }

  // Carências (IPI: interstício 3 anos / venda 2 anos; ICMS: 4 anos)
  if (a.carroExistente === "com_isencao") {
    if (a.tempoIsencao === "menos2") {
      pendencias.push(
        `Carência ativa: nova isenção de IPI só após ${FEDERAL.IPI_INTERSTICE_YEARS} anos da última compra e ICMS após ${FEDERAL.ICMS_LOCK_YEARS} anos. Como resolver: aguarde o fim da carência ou avalie transferência para outro beneficiário.`,
      );
      inegavel = true;
    } else if (a.tempoIsencao === "de2a4") {
      pendencias.push(
        `Carência de ICMS ativa (4 anos): o IPI já pode estar liberado (interstício de 3 anos), mas o ICMS só após completar 4 anos da última compra com isenção.`,
      );
    }
  }

  // Faixa de preço vs tetos
  if (a.faixaPreco === "120a200") {
    pendencias.push(
      `Acima de R$ ${FEDERAL.ICMS_CEILING_PARTIAL.toLocaleString("pt-BR")} não há isenção de ICMS (o IPI vale até R$ ${FEDERAL.IPI_CEILING.toLocaleString("pt-BR")}). Como resolver: avalie versões até R$ 120 mil para manter a isenção estadual.`,
    );
  }

  // CNH / condutores
  if (a.paraQuem === "eu_condutor" && a.disabilityType === "fisica" && a.cnhRestriction !== "sim") {
    warnings.push(
      "Para IPI o STJ decidiu (2025) que restrição na CNH não pode ser exigida; para adaptações e IOF a perícia do Detran (JME) segue necessária.",
    );
  }
  if (a.paraQuem !== "eu_condutor") {
    warnings.push(
      "Não condutor: você indicará até 3 condutores autorizados (mesma localidade) e o carro fica no nome da pessoa com deficiência.",
    );
  }

  const status = inegavel ? "nao_elegivel" : pendencias.length > 0 ? "pendencias" : "elegivel";
  const proximosPassos =
    status === "nao_elegivel"
      ? [
          "Receba seu mapa no WhatsApp com a explicação completa do seu caso.",
          "Acompanhe a virada de regime: as regras atuais valem até 31/12/2026 e 2027 traz novas regras (sem filtro de grau).",
        ]
      : [
          `Receba o mapa de ${a.uf} no seu WhatsApp com portais, guias e prazos oficiais.`,
          "Organize os documentos-chave: identidade, CPF e laudo com conclusão funcional.",
          `Peça o IPI primeiro — a autorização vale ${FEDERAL.IPI_SISEN_AUTHORIZATION_DAYS} dias e destrava o ICMS.`,
          "Atenção ao relógio: as regras atuais valem até 31/12/2026.",
        ];

  return { status, pendencias, proximosPassos, warnings };
}

export const quizRouter = createRouter({
  submit: publicQuery
    .input(z.object({ answers: answersSchema, contato: contatoSchema }))
    .mutation(async ({ input }) => {
      const result = evaluateEligibility(input.answers);
      const [{ id }] = await getDb()
        .insert(leads)
        .values({
          name: input.contato.name,
          whatsapp: input.contato.whatsapp,
          lgpdConsent: input.contato.lgpdConsent,
          source: "quiz",
          uf: input.answers.uf,
          quizAnswers: input.answers,
          eligibilityResult: result,
          referredBy: input.contato.referredBy ?? null,
        })
        .$returningId();
      return { leadId: id, result };
    }),
});

/**
 * IsentaPCD — constantes compartilhadas front/back.
 * Fonte da verdade regulatória: /isentapcd/dossie_regulatorio.md (15/08/2026).
 * Regra: NUNCA inventar números. Onde o dossiê marca 🟡/🔴 ou "verificar com o
 * órgão", confidence reflete isso e campos incertos ficam null.
 */

// ── Negócio ────────────────────────────────────────────────────────────────
export const PRICE_EXECUTION = 497; // R$ — acompanhamento completo (pagamento único)
export const REFERRAL_REWARD = 100; // R$ de desconto na execução quando indicado converte
export const REGULATORY_DEADLINE = "2026-12-31"; // fim do regime vigente (Lei 8.989/95 art. 9º + Conv. 21/2026)

/**
 * POC v3: paywall DESLIGADO. Todo o código de pagamento continua no lugar —
 * para reativar basta voltar para `true`. Front e back leem esta flag.
 */
export const PAYWALL_ENABLED = false;

// ── Constantes federais canônicas (dossiê §10.2) ───────────────────────────
export const FEDERAL = {
  IPI_CEILING: 200_000,
  IPI_SISEN_AUTHORIZATION_DAYS: 270,
  IPI_SALE_LOCK_YEARS: 2,
  IPI_INTERSTICE_YEARS: 3,
  IOF_ONE_TIME_ONLY: true,
  IOF_MAX_HP: 127,
  ICMS_CEILING_FULL: 70_000,
  ICMS_CEILING_PARTIAL: 120_000,
  ICMS_AUTHORIZATION_DAYS: 180,
  ICMS_NF_PRESENTATION_BUSINESS_DAY: 15,
  ICMS_LOCK_YEARS: 4,
  REGIME_2026_EXPIRES: REGULATORY_DEADLINE,
  REGIME_2027: { OPERATION_CAP: 100_000, VEHICLE_CAP: 200_000, INTERVAL_YEARS: 3 },
  IPI_RATES_2026: {
    BEV: 0.043,
    PHEV_FLEX: 0.043,
    HEV_FLEX: 0.048,
    MHEV_FLEX: 0.053,
    ETHANOL: 0.058,
    FLEX: 0.063,
    PHEV_GAS: 0.083,
    HEV_GAS: 0.093,
    MHEV_GAS: 0.108,
    GASOLINE: 0.128,
    DIESEL: 0.183,
  },
} as const;

export const IMESC_FEE_2026 = 268.94; // 7 × UFESP 38,42 (SP) 🟢
export const RJ_TSE_2026 = 279.72; // 🟡 revalidar anualmente

// ── UFs ────────────────────────────────────────────────────────────────────
export const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
export type Uf = (typeof UF_LIST)[number];

export type Confidence = "official" | "secondary" | "check_org"; // 🟢🟡🔴
// "unknown" adicionado ao enum do briefing para NÃO exibir como fato UFs cujo
// tipo de IPVA o dossiê não cravou (BA/PE/MA/DF/RN/AL/SE).
export type IpvaType = "full" | "partial" | "discount60" | "restricted" | "none" | "unknown";
export type FuelType = "flex" | "gasolina" | "diesel" | "eletrico" | "hibrido";

/** Alíquotas de IPI 2026 ("IPI Verde", Decreto 12.549/2025) por combustível do catálogo. */
export const IPI_RATES_BY_FUEL: Record<FuelType, number> = {
  eletrico: FEDERAL.IPI_RATES_2026.BEV,
  hibrido: FEDERAL.IPI_RATES_2026.HEV_FLEX,
  flex: FEDERAL.IPI_RATES_2026.FLEX,
  gasolina: FEDERAL.IPI_RATES_2026.GASOLINE,
  diesel: FEDERAL.IPI_RATES_2026.DIESEL,
};

export const FUEL_LABELS: Record<FuelType, string> = {
  flex: "Flex",
  gasolina: "Gasolina",
  diesel: "Diesel",
  eletrico: "Elétrico",
  hibrido: "Híbrido",
};

// ── Matriz das 27 UFs (dossiê §4) ──────────────────────────────────────────
export interface UfMatrixEntry {
  uf: Uf;
  icms: {
    existe: boolean;
    tetoIntegral: number | null; // R$ — padrão nacional 70.000
    tetoParcial: number | null; // R$ — padrão nacional 120.000 (parcela de 70 mil)
    aliquota: number | null; // estimativa p/ simulador (🟡 tabelas setoriais; SP 🟢)
    sistema: string | null; // portal/sistema oficial
    sistemaUrl: string | null;
    taxaPrevia: { existe: boolean; nome: string | null; valor: number | null };
    exigeIpiAntes: boolean; // regra nacional desde 2021 (Conv. 59/2020)
    excecaoDown: boolean; // exceção Síndrome de Down (Conv. 161/2021); SP NÃO aplica
    autorizacaoDias: number; // 180 (SP: 270)
    confidence: Confidence;
  };
  ipva: {
    tipo: IpvaType;
    teto: number | null; // R$ — null = sem teto ou não cravado (ver confidence)
    prazoPosCompraDias: number | null;
    renovacaoAnual: boolean;
    lei: string | null;
    confidence: Confidence;
  };
  pericia: { orgao: string | null; custo: number | null; validadeDias: number | null };
  confidence: Confidence; // pior confiança da linha
  notes: string[]; // armadilhas/observações
  verificarComOrgao: string[]; // lacunas 🔴 — nunca exibir como fato
}

const NACIONAL = {
  existe: true,
  tetoIntegral: FEDERAL.ICMS_CEILING_FULL,
  tetoParcial: FEDERAL.ICMS_CEILING_PARTIAL,
  exigeIpiAntes: true,
  excecaoDown: true,
  autorizacaoDias: FEDERAL.ICMS_AUTHORIZATION_DAYS,
} as const;

export const UF_MATRIX: Record<Uf, UfMatrixEntry> = {
  SP: {
    uf: "SP",
    icms: {
      ...NACIONAL,
      aliquota: 0.12, // 🟢 RC 28152/2023
      sistema: "SIVEI — portal.fazenda.sp.gov.br (login Gov.br)",
      sistemaUrl: "https://portal.fazenda.sp.gov.br",
      taxaPrevia: { existe: false, nome: null, valor: null }, // sem DARE antes do protocolo
      excecaoDown: false, // SP NÃO aplica a exceção Down (§8º, Conv. 161/2021)
      autorizacaoDias: 270, // procedimento próprio de SP
      confidence: "official",
    },
    ipva: {
      tipo: "full",
      teto: 70_000, // total até 70 mil; 70–120 mil = parcial (paga sobre o excedente)
      prazoPosCompraDias: 30, // veículo novo: 30 dias da NF (Port. CAT 27/2015)
      renovacaoAnual: false, // laudo IMESC 5 anos; comunicar cessação em 30 dias
      lei: "Lei 13.296/2008, art. 13-A + Dec. 66.470/2022 c/c 70.090/2025",
      confidence: "official",
    },
    pericia: {
      orgao: "IMESC (clínicas credenciadas); desde 03/08/2026 aceita laudo JME Detran-SP (Port. IMESC 14/2026)",
      custo: IMESC_FEE_2026,
      validadeDias: 1825, // laudo IMESC 5 anos
    },
    confidence: "official",
    notes: [
      "IPVA: isenção total até R$ 70 mil; entre R$ 70 mil e R$ 120 mil paga só sobre o excedente.",
      "Exige grau moderado/grave/gravíssimo — SP indeferiu 34 mil pedidos em 2025 por 'grau leve'.",
      "Sem débitos de IPVA/Cadin. Recurso no SIPET (30 dias do 5º dia útil).",
    ],
    verificarComOrgao: [],
  },
  RJ: {
    uf: "RJ",
    icms: {
      ...NACIONAL,
      aliquota: 0.12, // efetiva via RBC 🟡
      sistema: "SEI-RJ (processo 'IPVA: Solicitação de Reconhecimento de Isenção – PCD/autismo')",
      sistemaUrl: null,
      taxaPrevia: { existe: true, nome: "TSE via DARJ", valor: RJ_TSE_2026 }, // 🟡 sujeito a atualização
      confidence: "secondary",
    },
    ipva: {
      tipo: "full",
      teto: 55_000, // 🟡 Res. Sefaz 845/2025 — veículos novos nacionais
      prazoPosCompraDias: null,
      renovacaoAnual: false, // ~3 anos 🟡
      lei: "Lei 7.068/2015",
      confidence: "secondary",
    },
    pericia: {
      orgao: "Identidade especial Detran-RJ; mental/TEA: médico + psicólogo de serviço público",
      custo: null,
      validadeDias: null,
    },
    confidence: "secondary",
    notes: [
      "Teto de IPVA de R$ 55 mil praticamente exclui carro 0 km nacional — maior armadilha do Sudeste.",
      "Restituição de até 5 anos (TJ-RJ).",
    ],
    verificarComOrgao: ["Valor atualizado da TSE (DARJ)", "Prazo pós-compra do IPVA"],
  },
  MG: {
    uf: "MG",
    icms: {
      ...NACIONAL,
      aliquota: 0.12,
      sistema: "SIARE / Portal de Serviços SEF-MG",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DAE (não confirmado)", valor: null },
      confidence: "secondary",
    },
    ipva: {
      tipo: "full",
      teto: null,
      prazoPosCompraDias: null,
      renovacaoAnual: false, // conforme natureza da deficiência
      lei: "Lei estadual (verificar dispositivo com SEF-MG)",
      confidence: "secondary",
    },
    pericia: {
      orgao: "Laudo SUS ou credenciado Detran-MG; TJMG aceita laudo RFB (dispensa perícia Detran)",
      custo: null,
      validadeDias: null,
    },
    confidence: "secondary",
    notes: ["Jurisprudência favorável a laudo federal (REsp 1.937.373/MG)."],
    verificarComOrgao: ["Taxa prévia (DAE) — confirmar com SEF-MG", "Teto e prazos de IPVA"],
  },
  ES: {
    uf: "ES",
    icms: {
      ...NACIONAL,
      aliquota: 0.12,
      sistema: "E-Flow (integrado ao E-Docs) — exclusivo desde 20/01/2026",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DUA (valor a confirmar)", valor: null },
      confidence: "official",
    },
    ipva: {
      tipo: "full",
      teto: null,
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: "Lei estadual (inclui deficiência auditiva unilateral total, Sefaz-ES)",
      confidence: "secondary",
    },
    pericia: { orgao: "Laudo pericial de médico do SUS", custo: null, validadeDias: null },
    confidence: "secondary",
    notes: ["ADI 3495/ES: STF confirmou a constitucionalidade da isenção."],
    verificarComOrgao: ["Valor da DUA", "Teto e prazos de IPVA"],
  },
  PR: {
    uf: "PR",
    icms: {
      ...NACIONAL,
      aliquota: 0.195, // 19–19,5% 🟡
      sistema: "Portal de atendimento SEFA-PR (nome exato a confirmar)",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: null, valor: null },
      confidence: "secondary",
    },
    ipva: {
      tipo: "full",
      teto: null, // sem teto de valor; limite de 155 CV
      prazoPosCompraDias: 30, // veículo novo: 30 dias da aquisição
      renovacaoAnual: false,
      lei: "Lei 14.260/2003, art. 14, V + Res. SEFA 135/2021 c/c 353/2025; Lei 22.262/2024",
      confidence: "secondary",
    },
    pericia: {
      orgao: "Condutor físico/visual: perícia Detran-PR; não condutor/mental/Down/TEA: laudo SUS/conveniado",
      custo: null,
      validadeDias: null,
    },
    confidence: "secondary",
    notes: [
      "IPVA sem teto de valor, mas com limite de 155 CV.",
      "TEA não exige incapacidade de dirigir (revogado em 2025).",
      "ICMS teve 'vale' abr–mai/2026 (prorrogação retroativa pelo Dec. 13.520/2026).",
    ],
    verificarComOrgao: ["Nome exato do portal SEFA-PR", "Existência de taxa prévia"],
  },
  RS: {
    uf: "RS",
    icms: {
      ...NACIONAL,
      aliquota: 0.12,
      sistema: "Portal Pessoa Física (PPF) da Receita Estadual",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: null, valor: null },
      confidence: "official",
    },
    ipva: {
      tipo: "full",
      teto: 144_294.68, // 5.094 UPF-RS — novos 2026 🟢
      prazoPosCompraDias: null, // novo: vale desde a data da aquisição
      renovacaoAnual: false,
      lei: "Lei 8.115/85, art. 4º, VI",
      confidence: "official",
    },
    pericia: {
      orgao: "Condutor físico: junta Detran-RS (inicia no CFC); não condutor: laudo RFB/Detran/SUS",
      custo: null,
      validadeDias: null,
    },
    confidence: "official",
    notes: [
      "Exige IPI deferido antes (exceto Down) — documentado.",
      "Análise em até 3 dias úteis.",
      "Visão monocular indeferida no administrativo (TJRS concede na Justiça).",
      "Veículo usado: isenção só no exercício seguinte se transferido após 01/01.",
    ],
    verificarComOrgao: [],
  },
  SC: {
    uf: "SC",
    icms: {
      ...NACIONAL,
      aliquota: 0.12, // contribuinte 🟡
      sistema: "TTD online (código 419) — portal SEF/SC; homologar ANTES da compra",
      sistemaUrl: null,
      taxaPrevia: { existe: true, nome: "DARE (taxa do TTD)", valor: null }, // valor 2026 🔴
      confidence: "official",
    },
    ipva: {
      tipo: "full",
      teto: 200_000,
      prazoPosCompraDias: null, // pedir até a data limite da cota única; análise 90+90 dias
      renovacaoAnual: false,
      lei: "Lei 7.543/88, art. 8º, V, 'e' + RIPVA art. 6º, IV, 'm' (Dec. 1257/2025)",
      confidence: "official",
    },
    pericia: {
      orgao: "Laudo SUS com 2 profissionais + declaração SUS",
      custo: null,
      validadeDias: null, // validade indeterminada
    },
    confidence: "official",
    notes: [
      "Sem o DARE pago o pedido nem é analisado.",
      "Teto medido pelo preço ao público geral (Consulta 49/2019).",
      "Até 2 condutores quando não condutor.",
      "Parcialidade de R$ 70 mil no ICMS é 🟡 — confirmar no RICMS/SC.",
    ],
    verificarComOrgao: ["Valor 2026 do DARE da taxa do TTD"],
  },
  BA: {
    uf: "BA",
    icms: {
      ...NACIONAL,
      aliquota: 0.12, // 🟡 (dossiê também lista 20,5% — conflito de tabela setorial)
      sistema: "Portal BA.GOV.BR ou SEI Bahia",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DAE (não confirmado)", valor: null },
      confidence: "secondary",
    },
    ipva: {
      tipo: "unknown",
      teto: null,
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: null,
      confidence: "check_org",
    },
    pericia: { orgao: "Junta médica oficial/SUS", custo: null, validadeDias: null },
    confidence: "check_org",
    notes: [],
    verificarComOrgao: ["Regra de IPVA (dispositivo, teto e prazos) com a Sefaz-BA", "Taxa prévia (DAE)"],
  },
  PE: {
    uf: "PE",
    icms: {
      ...NACIONAL,
      aliquota: 0.205,
      sistema: "Portal sefaz.pe.gov.br (sistema a confirmar)",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DAE (não confirmado)", valor: null },
      confidence: "secondary",
    },
    ipva: {
      tipo: "unknown",
      teto: null,
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: null,
      confidence: "check_org",
    },
    pericia: { orgao: "SUS/Detran-PE", custo: null, validadeDias: null },
    confidence: "check_org",
    notes: ["IPVA-PE sem fonte primária cravada — nunca exibir como fato."],
    verificarComOrgao: ["Regra de IPVA (teto/lei) com a Sefaz-PE", "Sistema de protocolo", "Taxa prévia (DAE)"],
  },
  CE: {
    uf: "CE",
    icms: {
      ...NACIONAL,
      aliquota: 0.2,
      sistema: "Sistema Tramita (login Acesso Cidadão) — 'Solicitação de Isenção de IPVA/ICMS'",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DAE (não confirmado)", valor: null },
      confidence: "secondary",
    },
    ipva: {
      tipo: "full",
      teto: 157_468, // ≤ 25.000 UFIRCE (2026) 🟡
      prazoPosCompraDias: null,
      renovacaoAnual: true, // pedido anual
      lei: "Lei estadual",
      confidence: "secondary",
    },
    pericia: { orgao: "SUS/Detran-CE", custo: null, validadeDias: null },
    confidence: "secondary",
    notes: ["IPVA exige pedido anual de renovação."],
    verificarComOrgao: ["Taxa prévia (DAE)", "Prazos pós-compra"],
  },
  MA: {
    uf: "MA",
    icms: {
      ...NACIONAL,
      aliquota: 0.23,
      sistema: "Portal sefaz.ma.gov.br (sistema a confirmar)",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DARE (não confirmado)", valor: null },
      confidence: "secondary",
    },
    ipva: {
      tipo: "unknown",
      teto: null,
      prazoPosCompraDias: null,
      renovacaoAnual: false, // renovação a cada 4 anos (ver notes)
      lei: null,
      confidence: "check_org",
    },
    pericia: { orgao: "SUS/Detran-MA", custo: null, validadeDias: null },
    confidence: "check_org",
    notes: ["Renovação do IPVA a cada 4 anos sob pena de perda — armadilha de perda."],
    verificarComOrgao: ["Regra de IPVA (lei/teto) com a Sefaz-MA", "Taxa prévia (DARE)"],
  },
  GO: {
    uf: "GO",
    icms: {
      ...NACIONAL,
      aliquota: 0.12, // efetiva 🟡
      sistema: "Portal Secretaria da Economia GO (provável PDP — a confirmar)",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DARE (não confirmado)", valor: null },
      confidence: "secondary",
    },
    ipva: {
      tipo: "full",
      teto: 120_000, // Dec. 10.366/2023 🟡
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: "Dec. 10.366/2023",
      confidence: "secondary",
    },
    pericia: {
      orgao: "Laudo SUS (Apêndice XXXIX) + declaração de vínculo SUS + Anexo VIII IN 1769 (TEA)",
      custo: null,
      validadeDias: null,
    },
    confidence: "secondary",
    notes: [
      "Condutores autorizados devem residir no mesmo município.",
      "Checklist oficial de 15 documentos para TEA não condutor; casos de resistência a autista condutor.",
    ],
    verificarComOrgao: ["Sistema de protocolo (provável PDP)", "Taxa prévia (DARE)"],
  },
  DF: {
    uf: "DF",
    icms: {
      existe: true,
      tetoIntegral: null, // 🔴 CONFLITO: 100 × 120 × 140 mil
      tetoParcial: null,
      aliquota: 0.12, // 🟡 (tabela setorial também lista 20% — conflito)
      sistema: "Portal Atendimento Virtual Secretaria de Economia DF",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DARE (não confirmado)", valor: null },
      exigeIpiAntes: true,
      excecaoDown: true,
      autorizacaoDias: 180,
      confidence: "check_org",
    },
    ipva: {
      tipo: "unknown",
      teto: null,
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: null,
      confidence: "check_org",
    },
    pericia: { orgao: "Clínicas credenciadas Detran-DF", custo: null, validadeDias: null },
    confidence: "check_org",
    notes: [],
    verificarComOrgao: [
      "Teto de ICMS vigente — RICMS e anúncio do GDF divergem (100/120/140 mil): confirmar com a SEEC-DF",
      "Regra de IPVA com a SEEC-DF",
    ],
  },
  MT: {
    uf: "MT",
    icms: {
      ...NACIONAL,
      aliquota: 0.17,
      sistema: "e-Process (processo eletrônico) ou Agência Fazendária",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DAR (não confirmado)", valor: null },
      confidence: "official",
    },
    ipva: {
      tipo: "full",
      teto: null,
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: "Sefaz-MT oficial",
      confidence: "official",
    },
    pericia: {
      orgao: "Condutor: laudo Detran-MT + CNH com restrições; não condutor: laudo SUS + até 3 condutores (mesma localidade)",
      custo: null,
      validadeDias: null,
    },
    confidence: "official",
    notes: ["Checklist oficial publicado (Sefaz-MT)."],
    verificarComOrgao: ["Taxa prévia (DAR)"],
  },
  MS: {
    uf: "MS",
    icms: {
      ...NACIONAL,
      aliquota: 0.17,
      sistema: "Portal sefaz.ms.gov.br (sistema a confirmar)",
      sistemaUrl: null,
      taxaPrevia: { existe: true, nome: "DAEMS", valor: null },
      confidence: "secondary",
    },
    ipva: {
      tipo: "discount60", // NÃO é isenção
      teto: null,
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: "Lei 1.810/97",
      confidence: "secondary",
    },
    pericia: { orgao: "Detran-MS ou especialista conveniado", custo: null, validadeDias: null },
    confidence: "secondary",
    notes: ["NUNCA prometer 'IPVA zero' em MS — é desconto de 60%."],
    verificarComOrgao: ["Sistema de protocolo", "Valor da DAEMS", "Prazos pós-compra"],
  },
  PA: {
    uf: "PA",
    icms: {
      ...NACIONAL,
      aliquota: 0.12,
      sistema: "Portal de Serviços Sefa-PA (fluxo a confirmar)",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: null, valor: null }, // não localizada
      confidence: "secondary",
    },
    ipva: {
      tipo: "full",
      teto: null, // sem teto de valor
      prazoPosCompraDias: null, // pedido antes do vencimento (sem restituição)
      renovacaoAnual: false, // automático (mesmo proprietário + laudo válido)
      lei: "Lei 6.017/96, art. 3º, XII, 'a' (Lei 10.307/2023)",
      confidence: "official",
    },
    pericia: { orgao: "Laudo de órgão competente; condutor: perícia Detran-PA", custo: null, validadeDias: null },
    confidence: "secondary",
    notes: [
      "Única UF do Norte sem teto e sem renovação de IPVA.",
      "Débitos fiscais/previdenciários vedam o benefício.",
    ],
    verificarComOrgao: ["Fluxo do Portal de Serviços Sefa-PA"],
  },
  AM: {
    uf: "AM",
    icms: {
      ...NACIONAL,
      aliquota: 0.2, // desconto real ~18% pela alíquota interna
      sistema: "Portfólio de Serviços Sefaz-AM (serviços 304/305) + Protocolo Virtual (assunto 2111) / GERE-Detri",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "Taxa de Expediente, se devida", valor: null },
      confidence: "secondary", // internalização no RICMS 🔴
    },
    ipva: {
      tipo: "full",
      teto: null, // sem teto desde 01/01/2026
      prazoPosCompraDias: null, // protocolar até o vencimento do imposto
      renovacaoAnual: true, // ANUAL obrigatória (art. 14)
      lei: "Lei 4.719/2018, art. 10-A + Lei 7.794/2024 + Dec. 53.497/2026",
      confidence: "official",
    },
    pericia: {
      orgao: "Laudo SUS/conveniado ou perícia Detran-AM; dispensa laudo com CiPcD/Ciptea/CNH com restrição (exceto códigos A,B,T,U,V,X,Y,Z)",
      custo: null,
      validadeDias: null,
    },
    confidence: "official",
    notes: [
      "Quem não renovar o IPVA anualmente perde o exercício.",
      "Licenciamento Detran-AM segue devido.",
    ],
    verificarComOrgao: ["Internalização do Conv. 38/12 no RICMS-AM", "Taxa de expediente, se devida"],
  },
  RO: {
    uf: "RO",
    icms: {
      ...NACIONAL,
      aliquota: null, // 🔴 não consta na tabela setorial do dossiê — validar no RICMS-RO
      sistema: "Agência Virtual Sefin-RO + e-PAT (epat.sefin.ro.gov.br)",
      sistemaUrl: "https://epat.sefin.ro.gov.br",
      taxaPrevia: { existe: false, nome: null, valor: null }, // não localizada
      confidence: "secondary",
    },
    ipva: {
      tipo: "full",
      teto: 120_000, // novos e usados
      prazoPosCompraDias: null,
      renovacaoAnual: false, // vale exercícios seguintes mantidas as condições
      lei: "RIPVA-RO (Dec. 9.963/2002), art. 7º, IV",
      confidence: "secondary", // divergência Dec. 29.241 × 29.421 🔴
    },
    pericia: { orgao: "Laudos de serviços públicos ou privados aceitos", custo: null, validadeDias: null },
    confidence: "secondary",
    notes: [
      "Imprensa oficial errou ('integral até 120 mil' no ICMS — correto: parcela de 70 mil).",
      "Usados incluídos até o teto de R$ 120 mil.",
    ],
    verificarComOrgao: [
      "Número do decreto do IPVA no DOE-RO (divergência 29.241 × 29.421)",
      "Alíquota interna de ICMS sobre veículo novo",
    ],
  },
  AC: {
    uf: "AC",
    icms: {
      ...NACIONAL,
      aliquota: 0.19, // 19–19,5% 🟡
      sistema: "Reconhecimento prévio Sefaz-AC; Sefaz Online AC",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: null, valor: null }, // não localizada
      confidence: "official",
    },
    ipva: {
      tipo: "full",
      teto: 120_000, // + renda ≤ 10 salários mínimos
      prazoPosCompraDias: null, // NF ao fisco até o 15º dia útil; adaptação em 180 dias
      renovacaoAnual: false, // novo laudo dispensado se deficiência irreversível
      lei: "LC 114/2002, art. 12, VII c/c LC 444/2023",
      confidence: "official",
    },
    pericia: {
      orgao: "Perícia Detran-AC (adaptados) ou laudo médico+psicólogo SUS (mental/TEA)",
      custo: null,
      validadeDias: null,
    },
    confidence: "official",
    notes: [
      "Armadilha: critério de renda (≤ 10 salários mínimos) pode indeferir quem obtém ICMS.",
      "Usados incluídos (valor venal ≤ teto).",
    ],
    verificarComOrgao: [],
  },
  RR: {
    uf: "RR",
    icms: {
      existe: true, // esperado (regra do Convênio) — internalização não localizada online 🔴
      tetoIntegral: FEDERAL.ICMS_CEILING_FULL,
      tetoParcial: FEDERAL.ICMS_CEILING_PARTIAL,
      aliquota: 0.12,
      sistema: null, // não localizado
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: null, valor: null },
      exigeIpiAntes: true,
      excecaoDown: true,
      autorizacaoDias: 180,
      confidence: "check_org",
    },
    ipva: {
      tipo: "full",
      teto: null, // sem teto monetário explícito
      prazoPosCompraDias: 180, // veículo novo: até 180 dias da NF; pedido antes do vencimento
      renovacaoAnual: false,
      lei: "Lei 59/1993 (arts. 97-98) + IN SEFAZ 1/2018 c/c IN 2/2025",
      confidence: "secondary",
    },
    pericia: { orgao: "Clínica credenciada Detran-RR ou SUS", custo: null, validadeDias: 1825 }, // laudo 5 anos; TEA indeterminado
    confidence: "check_org",
    notes: [
      "Débitos tributários bloqueiam (IN 3/2024).",
      "Condutor autorizado obrigatório se a PCD não dirige.",
      "Laudo de TEA tem validade indeterminada.",
    ],
    verificarComOrgao: ["Internalização do Conv. 38/12 — confirmar com SEFAZ-RR/DITRI", "Sistema de protocolo"],
  },
  AP: {
    uf: "AP",
    icms: {
      ...NACIONAL,
      aliquota: null, // 🔴 não consta na tabela setorial do dossiê — validar no RICMS-AP
      sistema: "Requerimento à SEFAZ-AP",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: null, valor: null }, // não localizada
      confidence: "secondary",
    },
    ipva: {
      tipo: "restricted", // só veículos novos nacionais/nacionalizados
      teto: null, // usados: valor venal ≤ teto do ICMS
      prazoPosCompraDias: null, // requerimento na época do licenciamento anual
      renovacaoAnual: true,
      lei: "Lei 3.152/2024, art. 6º, IV + Dec. 3.677/2025",
      confidence: "secondary",
    },
    pericia: { orgao: "Laudo de serviço público ou privado conveniado ao SUS", custo: null, validadeDias: null },
    confidence: "secondary",
    notes: [
      "Importado não nacionalizado fica fora do IPVA.",
      "Vender antes de 2 anos: perda do benefício + recolhimento retroativo.",
      "Até 3 condutores autorizados (Dec. 3.677/2025).",
    ],
    verificarComOrgao: ["Fluxo do requerimento à SEFAZ-AP", "Alíquota interna de ICMS sobre veículo novo"],
  },
  TO: {
    uf: "TO",
    icms: {
      ...NACIONAL,
      aliquota: 0.12,
      sistema: "Reconhecimento prévio Sefaz-TO (RICMS-TO art. 3º, Seção II — Dec. 6.727/2024, prorrogado pelo Dec. 7.150/2026 até 31/12/2026)",
      sistemaUrl: null,
      taxaPrevia: { existe: true, nome: "TSE (pedidos administrativos)", valor: null },
      confidence: "official",
    },
    ipva: {
      tipo: "partial", // até 120 mil, isenção só na parcela de 70 mil
      teto: 120_000,
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: "Lei 1.287/2001 (CTE), art. 71, VI, red. Lei 4.426/2024",
      confidence: "official",
    },
    pericia: {
      orgao: "Clínica credenciada Detran-TO",
      custo: null, // custos 🔴
      validadeDias: null, // validade indeterminada (Lei 4.138/2023)
    },
    confidence: "official",
    notes: ["IPVA não é zero em TO — é parcial (só a parcela de R$ 70 mil).", "Inclui surdez/auditiva."],
    verificarComOrgao: ["Valor da TSE", "Custo da perícia"],
  },
  PB: {
    uf: "PB",
    icms: {
      ...NACIONAL,
      aliquota: 0.2,
      sistema: "Portal receita.pb.gov.br (sistema a confirmar)",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DAR (não confirmado)", valor: null },
      confidence: "secondary",
    },
    ipva: {
      tipo: "full",
      teto: 70_000, // 🟡 validado pelo IRDR 15/TJPB
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: "Lei estadual",
      confidence: "secondary",
    },
    pericia: { orgao: "SUS/Detran-PB", custo: null, validadeDias: null },
    confidence: "secondary",
    notes: ["IRDR Tema 15/TJPB: teto válido, carência de 4 anos no IPVA, até 3 condutores."],
    verificarComOrgao: ["Sistema de protocolo", "Taxa prévia (DAR)"],
  },
  RN: {
    uf: "RN",
    icms: {
      existe: true,
      tetoIntegral: 100_000, // elevação a 120 mil não localizada 🔴
      tetoParcial: null,
      aliquota: 0.2,
      sistema: "Portal SET-RN (sistema a confirmar)",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "Guia SET-RN (não confirmada)", valor: null },
      exigeIpiAntes: true,
      excecaoDown: true,
      autorizacaoDias: 180,
      confidence: "check_org",
    },
    ipva: {
      tipo: "unknown",
      teto: null,
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: null,
      confidence: "check_org",
    },
    pericia: { orgao: "SUS/Detran-RN", custo: null, validadeDias: null },
    confidence: "check_org",
    notes: [],
    verificarComOrgao: ["Teto de ICMS vigente (100 mil × 120 mil) com a SET-RN", "Regra de IPVA", "Guia/taxa prévia"],
  },
  AL: {
    uf: "AL",
    icms: {
      ...NACIONAL,
      aliquota: 0.205, // desde 04/2026 🟡
      sistema: "Atendente virtual 'Nise' + Espaço do Contribuinte",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DAR (não confirmado)", valor: null },
      confidence: "secondary",
    },
    ipva: {
      tipo: "unknown",
      teto: null,
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: null,
      confidence: "secondary",
    },
    pericia: { orgao: "SUS/Detran-AL", custo: null, validadeDias: null },
    confidence: "secondary",
    notes: [],
    verificarComOrgao: ["Regra de IPVA com a Sefaz-AL", "Taxa prévia (DAR)"],
  },
  SE: {
    uf: "SE",
    icms: {
      ...NACIONAL,
      aliquota: 0.2,
      sistema: "Portal sefaz.se.gov.br (sistema a confirmar)",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DAE (não confirmado)", valor: null },
      confidence: "official", // Portaria SEFAZ 10/2013 registra exigência de IPI
    },
    ipva: {
      tipo: "unknown", // Lei 9.517/2024 + Dec. 894/2024 — texto aberto não localizado 🔴
      teto: null,
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: "Lei 9.517/2024 + Dec. 894/2024 (texto não localizado)",
      confidence: "check_org",
    },
    pericia: { orgao: "SUS ou credenciado Detran-SE", custo: null, validadeDias: null },
    confidence: "check_org",
    notes: ["Nunca exibir regra de SE como fato sem checar o texto da lei."],
    verificarComOrgao: ["Texto da Lei 9.517/2024 (IPVA)", "Sistema de protocolo", "Taxa prévia (DAE)"],
  },
  PI: {
    uf: "PI",
    icms: {
      ...NACIONAL,
      aliquota: 0.225,
      sistema: "Novo SIATweb → Processo Eletrônico Tributário → Protocolo Eletrônico → 'Abertura de Processo – Público'",
      sistemaUrl: null,
      taxaPrevia: { existe: false, nome: "DAR (não confirmado)", valor: null },
      confidence: "secondary",
    },
    ipva: {
      tipo: "restricted", // 2026: regra restrita (rol antigo)
      teto: null, // 200 mil apenas a partir do IPVA 2027 (Lei 8.946/2026) 🟡
      prazoPosCompraDias: null,
      renovacaoAnual: false,
      lei: "Regra restrita em 2026; Lei 8.946/2026 amplia (TEA/visual/auditiva/mental, teto R$ 200 mil) só para IPVA 2027",
      confidence: "secondary",
    },
    pericia: { orgao: "SUS/Detran-PI", custo: null, validadeDias: null },
    confidence: "secondary",
    notes: [
      "Armadilha temporal: a ampliação da Lei 8.946/2026 (teto R$ 200 mil) só vale para o IPVA 2027 — não prometer em 2026.",
    ],
    verificarComOrgao: ["Rol vigente de IPVA 2026", "Taxa prévia (DAR)"],
  },
};

// ── Etapas do processo (jornada de 7 etapas — design.md / admin.md A3) ──────
export type StageKey =
  | "descoberta"
  | "mapa"
  | "documentos"
  | "ipi"
  | "icms"
  | "compra"
  | "pos_compra";

export type StageStatus =
  | "pending"
  | "in_progress"
  | "waiting_org"
  | "waiting_user"
  | "done"
  | "blocked";

export interface StageDef {
  key: StageKey;
  order: number;
  title: string;
  short: string; // nome curto (kanban admin)
  description: string;
  dependsOn: StageKey[]; // etapas que precisam estar "done"
  postGate: boolean; // etapa de execução após o paywall (R$ 497)
  // Clareza da jornada (lição: toda etapa precisa deixar começo/meio/fim óbvios)
  objetivo: string; // por que esta etapa existe
  nossoPapel: string; // o que a plataforma/time faz
  seuPapel: string; // o que o cliente precisa fazer
  terminaQuando: string; // critério objetivo de conclusão
}

export const STAGES: StageDef[] = [
  {
    key: "descoberta",
    order: 1,
    title: "Descoberta e pré-análise",
    short: "Descoberta",
    description: "Quiz de elegibilidade de 2 minutos: descubra se você tem direito.",
    dependsOn: [],
    postGate: false,
    objetivo: "Responder à pergunta que trava todo mundo: \"eu (ou quem eu cuido) tenho direito?\"",
    nossoPapel: "Rodar as regras oficiais de 2026 nas suas respostas e te dar um veredito em linguagem humana, com pendências explicadas.",
    seuPapel: "Responder o quiz de 2 minutos (dá para começar sem conta, sem documento).",
    terminaQuando: "Você recebe o resultado: elegível, elegível com pendências ou não elegível — com o porquê de cada ponto.",
  },
  {
    key: "mapa",
    order: 2,
    title: "Mapa da sua UF",
    short: "Mapa enviado",
    description: "Receba o passo a passo específico do seu estado, com portais e prazos oficiais.",
    dependsOn: ["descoberta"],
    postGate: false,
    objetivo: "Transformar \"tenho direito\" num plano concreto para o SEU estado — porque ICMS e IPVA mudam de UF para UF (teto, portal, guias e prazos).",
    nossoPapel: "Montar o mapa da sua UF com dados oficiais: o que vale aí, qual portal usar, quais guias precisam estar pagas e quais prazos não podem estourar.",
    seuPapel: "Ler o mapa (5 minutos) e confirmar com o botão \"Li e entendi meu mapa\".",
    terminaQuando: "Você confirma a leitura do mapa — aí o checklist de documentos da etapa 3 já nasce certinho para o seu estado.",
  },
  {
    key: "documentos",
    order: 3,
    title: "Organizar documentos",
    short: "Documentos",
    description: "Monte o checklist por órgão e envie os documentos para revisão.",
    dependsOn: ["mapa"],
    postGate: false,
    objetivo: "Provar o direito com a papelada certa — na primeira tentativa (documento errado é a causa nº 1 de indeferimento).",
    nossoPapel: "Ler cada arquivo automaticamente (OCR), avisar por e-mail se algo precisa de ajuste e revisar de verdade com olho humano.",
    seuPapel: "Seguir a trilha e enviar cada documento (foto do celular vale).",
    terminaQuando: "Todos os documentos obrigatórios do seu caso estão enviados e aprovados pelo time.",
  },
  {
    key: "ipi",
    order: 4,
    title: "Isenção de IPI (Receita Federal)",
    short: "IPI",
    description: "Protocolo no SISEN com conta Gov.br. Autorização válida por 270 dias.",
    dependsOn: ["documentos"],
    postGate: true,
    objetivo: "Obter a isenção federal (IPI) — sem ela, o ICMS nem começa na maioria dos estados.",
    nossoPapel: "Preparar o protocolo com seus documentos aprovados e te guiar tela a tela no SISEN (nunca pedimos sua senha do Gov.br).",
    seuPapel: "Acompanhar o protocolo e responder rápido se a Receita pedir complemento.",
    terminaQuando: "A Receita defere e emite a autorização — ela vale 270 dias para a compra.",
  },
  {
    key: "icms",
    order: 5,
    title: "Isenção de ICMS (Sefaz da sua UF)",
    short: "ICMS",
    description: "Depende do IPI deferido (exceto Síndrome de Down fora de SP). Autorização válida por 180 dias.",
    dependsOn: ["ipi"],
    postGate: true,
    objetivo: "Obter a isenção estadual (ICMS) — é ela que libera o preço com desconto na concessionária.",
    nossoPapel: "Protocolar no portal oficial da sua UF com o IPI já deferido e monitorar a análise.",
    seuPapel: "Garantir que guias/taxas do estado estejam pagas antes (quando o seu estado cobra) e aguardar a análise.",
    terminaQuando: "A Sefaz da sua UF defere e emite a autorização — em geral válida por 180 dias.",
  },
  {
    key: "compra",
    order: 6,
    title: "Compra e nota fiscal",
    short: "Compra",
    description: "Compre com a NF em nome da PCD, IPI destacado como isento, e apresente a NF à Sefaz até o 15º dia útil.",
    dependsOn: ["icms"],
    postGate: true,
    objetivo: "Comprar o carro com o desconto valendo — a nota fiscal certa é o que materializa a economia.",
    nossoPapel: "Conferir os dados da NF antes de emitir e te lembrar do prazo fatal de apresentá-la à Sefaz (15º dia útil).",
    seuPapel: "Comprar dentro do teto da sua UF, com a NF em nome da PCD e IPI destacado como isento.",
    terminaQuando: "A NF é emitida corretamente e apresentada à Sefaz dentro do prazo.",
  },
  {
    key: "pos_compra",
    order: 7,
    title: "Pós-compra e IPVA",
    short: "Pós-compra",
    description: "Pedido de isenção de IPVA, prazos pós-compra da sua UF e lembretes de carência (2/4 anos).",
    dependsOn: ["compra"],
    postGate: true,
    objetivo: "Fechar o pacote: IPVA isento (ou reduzido) e nenhum benefício perdido por prazo bobo.",
    nossoPapel: "Protocolar o IPVA dentro do prazo da sua UF (ex.: SP = 30 dias da NF) e te lembrar das carências e do licenciamento anual por e-mail.",
    seuPapel: "Nos avisar quando o carro for emplacado e manter os documentos em dia todo ano.",
    terminaQuando: "IPVA isento confirmado e lembretes anuais armados — sua jornada vira acompanhamento contínuo.",
  },
];

export const STAGE_MAP: Record<StageKey, StageDef> = Object.fromEntries(
  STAGES.map((s) => [s.key, s]),
) as Record<StageKey, StageDef>;

// ── Checklist documental por órgão (linguagem simples) ─────────────────────
export type DocGroupKey = "receita_sisen" | "sefaz_uf" | "detran_pericia" | "pos_compra" | "taxas_guias";

export interface DocTypeDef {
  docType: string;
  label: string;
  hint: string;
  conditional?: "nao_condutor" | "condutor_fisico" | "adaptacao";
}

export interface DocGroup {
  key: DocGroupKey;
  title: string;
  org: string;
  docs: DocTypeDef[];
}

export const DOC_CHECKLIST: DocGroup[] = [
  {
    key: "receita_sisen",
    title: "Receita Federal — IPI (SISEN)",
    org: "Receita Federal / SISEN",
    docs: [
      { docType: "doc_identidade", label: "Documento de identidade com foto", hint: "RG, CNH ou RNE da pessoa com deficiência." },
      { docType: "cpf", label: "CPF", hint: "Comprovante de situação cadastral regular na Receita." },
      { docType: "laudo_medico", label: "Laudo médico com CID e conclusão funcional", hint: "Emitido por serviço público, conveniado SUS, Detran/credenciada ou serviço social autônomo. Precisa descrever o impacto na mobilidade/condução — laudo só com CID é a principal causa de indeferimento." },
      { docType: "comprovante_residencia", label: "Comprovante de residência", hint: "Conta de água, luz ou telefone recente." },
      { docType: "declaracao_disponibilidade", label: "Declaração de disponibilidade financeira", hint: "Dispensada se houver financiamento bancário (Lei 10.690/2003)." },
      { docType: "autorizacao_ipi", label: "Autorização de isenção de IPI (carta do SISEN)", hint: "Emitida no SISEN após o deferimento. Válida por 270 dias." },
    ],
  },
  {
    key: "sefaz_uf",
    title: "Sefaz do seu estado — ICMS",
    org: "Secretaria da Fazenda estadual",
    docs: [
      { docType: "requerimento_icms", label: "Requerimento/protocolo do pedido de ICMS", hint: "Protocolado no portal da Sefaz da sua UF (veja seu mapa)." },
      { docType: "comprovante_domicilio_estadual", label: "Comprovante de domicílio no estado", hint: "Exigido para vincular o benefício à sua UF." },
      { docType: "declaracao_quitacao", label: "Quitação de débitos com a fazenda estadual", hint: "IPVA, multas e taxas em aberto bloqueiam o pedido em todas as UFs — quite antes de protocolar." },
      { docType: "cnh_condutores", label: "CNH dos condutores autorizados", hint: "Até 3 condutores, residentes na mesma localidade.", conditional: "nao_condutor" },
      { docType: "autorizacao_icms", label: "Autorização de isenção de ICMS", hint: "Válida por 180 dias (SP: 270). A NF deve ser apresentada até o 15º dia útil do mês seguinte à compra." },
    ],
  },
  {
    key: "detran_pericia",
    title: "Detran e perícia",
    org: "Detran / clínicas credenciadas",
    docs: [
      { docType: "laudo_pericial_detran", label: "Laudo/perícia do Detran ou clínica credenciada", hint: "Em SP: IMESC (R$ 268,94 em 2026). Nas demais UFs: SUS ou credenciada — veja seu mapa." },
      { docType: "cnh_restricao", label: "CNH com observações/restrições", hint: "Para condutor com deficiência física. Para IPI, o STJ decidiu em 2025 que a restrição na CNH não pode ser exigida.", conditional: "condutor_fisico" },
    ],
  },
  {
    key: "pos_compra",
    title: "Pós-compra",
    org: "Concessionária / Detran / Sefaz",
    docs: [
      { docType: "nf_compra", label: "Nota fiscal da compra (NF-e/DANFE)", hint: "Em nome da pessoa com deficiência, com o IPI dispensado destacado e a observação 'ISENTO DO IPI — Lei nº 8.989/95'." },
      { docType: "crlv", label: "CRLV-e (documento do carro)", hint: "Registro em nome da pessoa com deficiência." },
      { docType: "nf_adaptacao", label: "NF de adaptação veicular", hint: "Prazo de até 270 dias após a compra (Conv. 38/12).", conditional: "adaptacao" },
      { docType: "csv", label: "CSV — Certificado de Segurança Veicular", hint: "Emitido por ITL licenciada, quando houver adaptação.", conditional: "adaptacao" },
    ],
  },
  {
    key: "taxas_guias",
    title: "Taxas e guias pagas",
    org: "Sefaz / clínicas credenciadas",
    docs: [
      { docType: "guia_taxa_estadual", label: "Comprovante de guia estadual paga", hint: "Só em algumas UFs: RJ (TSE R$ 279,72 via DARJ), SC (DARE do TTD), MS (DAEMS). Federal é sempre gratuito." },
      { docType: "guia_pericia", label: "Comprovante de pagamento da perícia", hint: "Ex.: taxa IMESC em SP, paga à clínica no dia do exame." },
    ],
  },
];

/** docTypes de comprovante de guia/taxa paga — 1º envio dispara o paywall. */
export const TAX_DOCTYPES = ["guia_taxa_estadual", "guia_pericia"] as const;
export type TaxDocType = (typeof TAX_DOCTYPES)[number];

export const DOC_TYPE_MAP: Record<string, DocTypeDef & { group: DocGroupKey }> = Object.fromEntries(
  DOC_CHECKLIST.flatMap((g) => g.docs.map((d) => [d.docType, { ...d, group: g.key }])),
);

// ── Upload de documentos ───────────────────────────────────────────────────
export const DOC_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const DOC_ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png"] as const;

// ── Tipos compartilhados (quiz / simulador) ────────────────────────────────
export type QuizForWhom = "eu_condutor" | "eu_nao_condutor" | "filho_dependente" | "outro_familiar";
export type DisabilityType = "fisica" | "visual" | "auditiva" | "intelectual" | "tea" | "multipla" | "outra";
export type LaudoStatus = "recente" | "antigo" | "nenhum";
export type PriceBand = "ate70" | "70a120" | "120a200" | "nao_sei";

export interface QuizAnswers {
  paraQuem: QuizForWhom;
  uf: Uf;
  disabilityType: DisabilityType;
  teaSupportLevel?: 1 | 2 | 3 | "nao_sei";
  visaoMonocular?: boolean;
  cnhRestriction?: "sim" | "nao" | "sem_cnh_especial";
  quemDirige?: "eu_familiar" | "outra_pessoa" | "mais_de_uma";
  laudoStatus: LaudoStatus;
  carroExistente: "nenhum" | "com_isencao" | "sem_isencao";
  tempoIsencao?: "menos2" | "de2a4" | "mais4";
  debitos: "nao" | "sim" | "nao_sei";
  faixaPreco: PriceBand;
  quandoComprar?: "3meses" | "3a6meses" | "pesquisando";
}

export type EligibilityStatus = "elegivel" | "pendencias" | "nao_elegivel";

export interface EligibilityResult {
  status: EligibilityStatus;
  pendencias: string[]; // texto humano com "como resolver"
  proximosPassos: string[];
  warnings: string[];
}

export interface SimulationInput {
  preco: number; // R$
  uf: Uf;
  combustivel: FuelType;
  adaptacao: boolean;
  isDriver: boolean;
}

export interface SimulationResult {
  preco: number;
  uf: Uf;
  breakdown: {
    ipi: { aliquota: number; valor: number; isento: boolean; teto: number };
    icms: {
      aliquota: number | null;
      valor: number | null; // null = verificar com o órgão (sem alíquota/teto cravados)
      tipo: "integral" | "parcial" | "nenhuma" | "verificar";
      tetoIntegral: number | null;
      tetoParcial: number | null;
    };
    ipva: {
      tipo: IpvaType;
      teto: number | null;
      percentualIsencao: number | null; // 1 = total, 0.6 = MS, null = verificar
      disclaimer: string;
    };
    total: number | null; // null quando ICMS está em "verificar"
  };
  confidence: Confidence;
  warnings: string[];
}

export const DISCLAIMER_SIMULADOR =
  "Estimativa com base nas regras de 2026 (Lei 8.989/95, Convênio ICMS 38/2012 e leis estaduais). " +
  "Quem confirma o benefício é sempre o órgão público. IPVA do 1º ano pode ser proporcional " +
  "conforme a regra da sua UF.";

// ── Trilha guiada de documentos (POC v3) ───────────────────────────────────
/**
 * Achata o DOC_CHECKLIST numa sequência numerada única, na ordem lógica do
 * processo: identidade/CPF → laudo → CNH → guias/perícia → autorização IPI →
 * requerimento ICMS → NF-e → pós-compra.
 */
export const DOC_TRAIL: { phase: string; docTypes: string[] }[] = [
  { phase: "Quem é você", docTypes: ["doc_identidade", "cpf", "comprovante_residencia"] },
  { phase: "Laudos", docTypes: ["laudo_medico", "laudo_pericial_detran"] },
  { phase: "CNH", docTypes: ["cnh_restricao", "cnh_condutores"] },
  { phase: "Taxas e guias", docTypes: ["guia_pericia", "guia_taxa_estadual"] },
  {
    phase: "Isenção de IPI (Receita Federal)",
    docTypes: ["declaracao_disponibilidade", "autorizacao_ipi"],
  },
  {
    phase: "Isenção de ICMS (estado)",
    docTypes: [
      "requerimento_icms",
      "comprovante_domicilio_estadual",
      "declaracao_quitacao",
      "autorizacao_icms",
    ],
  },
  { phase: "Compra do carro", docTypes: ["nf_compra"] },
  { phase: "Depois da compra", docTypes: ["crlv", "nf_adaptacao", "csv"] },
];

/** Ordem plana da trilha (índice = passo - 1). */
export const DOC_TRAIL_ORDER: string[] = DOC_TRAIL.flatMap((p) => p.docTypes);

/** Instrução em linguagem simples para o card "Seu próximo passo". */
export const DOC_TRAIL_INSTRUCTIONS: Record<string, string> = {
  doc_identidade:
    "Tire uma foto nítida do RG (frente e verso) ou da CNH da pessoa com deficiência e envie aqui.",
  cpf: "Envie o comprovante de situação cadastral do CPF — dá para baixar grátis no site da Receita Federal.",
  comprovante_residencia: "Envie uma conta de água, luz ou telefone recente, no nome da família.",
  laudo_medico:
    "Este é o documento mais importante: o laudo precisa ter CID, assinatura do médico com CRM e dizer como a deficiência afeta a mobilidade ou a condução.",
  laudo_pericial_detran:
    "Agende a perícia no órgão do seu estado (em SP é o IMESC) e envie o laudo que eles entregarem.",
  cnh_restricao:
    "Se você vai dirigir, envie a CNH — se ainda não tem as observações de restrição, tudo bem: para o IPI elas não são exigidas.",
  cnh_condutores:
    "Se outra pessoa vai dirigir por você, envie a CNH de até 3 condutores que moram na mesma cidade.",
  guia_pericia:
    "Pague a taxa da perícia (ex.: IMESC em SP) e envie o comprovante — a foto do boleto pago serve.",
  guia_taxa_estadual:
    "Só alguns estados cobram taxa (RJ, SC, MS). Se o seu cobra, pague a guia e envie o comprovante.",
  declaracao_disponibilidade:
    "Baixe o modelo no site da Receita, preencha e assine — é dispensada se você for financiar o carro.",
  autorizacao_ipi:
    "Quando a Receita deferir seu pedido no SISEN, baixe a carta de autorização e envie aqui. Ela vale 270 dias.",
  requerimento_icms:
    "Protocol o pedido de ICMS no portal da Sefaz do seu estado e envie o comprovante de protocolo.",
  comprovante_domicilio_estadual:
    "Envie um comprovante de endereço no seu estado — vale conta de consumo recente.",
  declaracao_quitacao:
    "Quite qualquer IPVA ou multa em aberto e envie a certidão negativa da fazenda estadual.",
  autorizacao_icms:
    "Quando o estado deferir, baixe a autorização de ICMS e envie aqui. Atenção: ela vale 180 dias (SP: 270).",
  nf_compra:
    "Na compra, peça a NF no nome da pessoa com deficiência, com IPI destacado como isento, e envie aqui.",
  crlv: "Depois de emplacar, envie o CRLV-e (documento do carro) em nome da pessoa com deficiência.",
  nf_adaptacao: "Se o carro for adaptado, envie a nota fiscal da adaptação (prazo de 270 dias após a compra).",
  csv: "Se houve adaptação, envie o Certificado de Segurança Veicular emitido por uma ITL licenciada.",
};

// ── OCR (Mistral) — checagens de sanidade por tipo de documento ────────────
/**
 * `anyOf`: alternativas separadas por "|" — basta encontrar UMA no texto
 * normalizado (lowercase, sem acento) para a checagem passar.
 * `msg`: achado em português simples quando nada é encontrado (nunca rejeita).
 */
export interface OcrKeywordCheck {
  anyOf: string;
  msg: string;
}
export interface OcrDocHint {
  keywords: OcrKeywordCheck[];
  exigeNome?: boolean; // ≥2 tokens do nome do usuário precisam aparecer
  exigeCpf?: boolean; // os 11 dígitos do CPF do cadastro precisam aparecer
}

export const OCR_DOCTYPE_HINTS: Record<string, OcrDocHint> = {
  doc_identidade: {
    keywords: [
      {
        anyOf: "nascimento|filicao|registro",
        msg: "Não encontramos dados típicos de identidade (nascimento, filiação ou registro) — confira se enviou o documento certo.",
      },
    ],
    exigeNome: true,
    exigeCpf: true,
  },
  cpf: {
    keywords: [
      {
        anyOf: "cpf|cadastro de pessoa fisica|receita federal",
        msg: "Não encontramos menção ao CPF ou à Receita Federal — o comprovante de situação cadastral é baixado no site da Receita.",
      },
    ],
    exigeNome: true,
    exigeCpf: true,
  },
  laudo_medico: {
    keywords: [
      { anyOf: "laudo", msg: "Não encontramos a palavra 'laudo' no documento — confira se é o arquivo certo." },
      {
        anyOf: "cid",
        msg: "Não encontramos o CID no laudo — ele é obrigatório. Peça ao médico para incluir o código (ex.: CID G80).",
      },
      {
        anyOf: "medico|crm",
        msg: "Não encontramos a identificação do médico (nome ou CRM) — o laudo precisa estar assinado por médico, com CRM.",
      },
      {
        anyOf: "deficiencia|diagnostico",
        msg: "Não encontramos o diagnóstico ou a descrição da deficiência — laudo só com CID é a principal causa de indeferimento.",
      },
    ],
    exigeNome: true,
    exigeCpf: true,
  },
  comprovante_residencia: {
    keywords: [
      {
        anyOf: "endereco|logradouro|cep|residencia",
        msg: "Não encontramos um endereço no documento — envie uma conta de água, luz ou telefone recente.",
      },
    ],
    exigeNome: true,
  },
  declaracao_disponibilidade: {
    keywords: [
      {
        anyOf: "declaracao|declaro",
        msg: "Não encontramos o texto da declaração — use o modelo oficial da Receita Federal.",
      },
      {
        anyOf: "disponibilidade financeira|financiamento",
        msg: "Não encontramos a menção à disponibilidade financeira ou ao financiamento — confira o modelo preenchido.",
      },
    ],
    exigeNome: true,
    exigeCpf: true,
  },
  autorizacao_ipi: {
    keywords: [
      {
        anyOf: "sisen|receita federal",
        msg: "Não encontramos menção ao SISEN ou à Receita Federal — a autorização de IPI é a carta emitida no SISEN.",
      },
      { anyOf: "ipi", msg: "Não encontramos menção ao IPI no documento — confira se é a carta de autorização certa." },
      {
        anyOf: "autorizacao|deferido",
        msg: "Não encontramos a palavra 'autorização' ou 'deferido' — o documento precisa ser a autorização deferida.",
      },
    ],
    exigeNome: true,
    exigeCpf: true,
  },
  requerimento_icms: {
    keywords: [
      { anyOf: "icms", msg: "Não encontramos menção ao ICMS — confira se enviou o protocolo do pedido de isenção." },
      {
        anyOf: "requerimento|protocolo|solicitacao",
        msg: "Não encontramos número de protocolo ou requerimento — envie o comprovante gerado no portal da Sefaz.",
      },
    ],
    exigeNome: true,
    exigeCpf: true,
  },
  comprovante_domicilio_estadual: {
    keywords: [
      {
        anyOf: "endereco|logradouro|cep|domicilio",
        msg: "Não encontramos um endereço no documento — envie uma conta recente do seu estado.",
      },
    ],
    exigeNome: true,
  },
  declaracao_quitacao: {
    keywords: [
      {
        anyOf: "quitacao|quite|certidao negativa|nada consta|sem debito",
        msg: "Não encontramos a certidão ou declaração de quitação — emita a certidão negativa no site da Sefaz.",
      },
      {
        anyOf: "ipva|fazenda|tributo|debito",
        msg: "Não encontramos referência a tributos estaduais (IPVA/fazenda) — confira o documento enviado.",
      },
    ],
    exigeNome: true,
    exigeCpf: true,
  },
  cnh_condutores: {
    keywords: [
      {
        anyOf: "habilitacao|cnh",
        msg: "Não encontramos dados de CNH — envie a carteira de habilitação dos condutores autorizados.",
      },
      {
        anyOf: "categoria",
        msg: "Não encontramos a categoria da habilitação — a foto precisa mostrar a CNH inteira.",
      },
    ],
  },
  cnh_restricao: {
    keywords: [
      {
        anyOf: "habilitacao|cnh",
        msg: "Não encontramos dados de CNH — envie a carteira de habilitação.",
      },
      {
        anyOf: "observac|restricao|categoria",
        msg: "Não encontramos observações/restrições ou categoria — a foto precisa mostrar a CNH inteira.",
      },
    ],
    exigeNome: true,
  },
  laudo_pericial_detran: {
    keywords: [
      {
        anyOf: "pericia|laudo",
        msg: "Não encontramos menção à perícia ou ao laudo — envie o documento entregue pelo órgão pericial.",
      },
      {
        anyOf: "detran|imesc|clinica|perito",
        msg: "Não encontramos a identificação do órgão pericial (Detran/IMESC/clínica) — confira o documento.",
      },
      {
        anyOf: "medico|perito|crm",
        msg: "Não encontramos a assinatura do médico perito — o laudo precisa identificar o profissional.",
      },
    ],
    exigeNome: true,
    exigeCpf: true,
  },
  nf_compra: {
    keywords: [
      {
        anyOf: "nota fiscal|nf-e|danfe",
        msg: "Não encontramos a identificação de nota fiscal (NF-e/DANFE) — confira o arquivo.",
      },
      {
        anyOf: "chassi|veiculo|modelo",
        msg: "Não encontramos dados do veículo (chassi/modelo) — envie a NF completa da compra.",
      },
      {
        anyOf: "ipi",
        msg: "Não encontramos o destaque do IPI — a NF precisa mostrar o IPI dispensado/isento.",
      },
    ],
    exigeNome: true,
    exigeCpf: true,
  },
  crlv: {
    keywords: [
      {
        anyOf: "crlv|licenciamento|registro e licenciamento",
        msg: "Não encontramos a identificação do CRLV — envie o documento do carro (CRLV-e).",
      },
      { anyOf: "placa", msg: "Não encontramos a placa do veículo — a foto precisa mostrar o CRLV inteiro." },
      {
        anyOf: "chassi|renavam",
        msg: "Não encontramos chassi ou RENAVAM — confira se o documento é o CRLV.",
      },
    ],
    exigeNome: true,
    exigeCpf: true,
  },
  nf_adaptacao: {
    keywords: [
      {
        anyOf: "nota fiscal|nf-e",
        msg: "Não encontramos a identificação de nota fiscal — envie a NF da adaptação.",
      },
      {
        anyOf: "adaptacao|adaptacoes",
        msg: "Não encontramos menção à adaptação veicular — confira se a NF é a da oficina adaptadora.",
      },
    ],
    exigeNome: true,
  },
  csv: {
    keywords: [
      {
        anyOf: "certificado de seguranca veicular|csv",
        msg: "Não encontramos a identificação do CSV — envie o Certificado de Segurança Veicular.",
      },
      {
        anyOf: "itl|licenciada|inmetro",
        msg: "Não encontramos a ITL licenciada no certificado — o CSV precisa ser emitido por ITL credenciada.",
      },
    ],
    exigeNome: true,
  },
  guia_taxa_estadual: {
    keywords: [
      {
        anyOf: "pagamento|pago|valor",
        msg: "Não encontramos confirmação de pagamento — envie o comprovante da guia paga, não só o boleto.",
      },
      {
        anyOf: "vencimento",
        msg: "Não encontramos a data de vencimento — confira se o comprovante está completo e legível.",
      },
      {
        anyOf: "beneficiario|favorecido",
        msg: "Não encontramos o beneficiário/favorecido da guia — o comprovante precisa identificar quem recebeu.",
      },
    ],
  },
  guia_pericia: {
    keywords: [
      {
        anyOf: "pagamento|pago|valor",
        msg: "Não encontramos confirmação de pagamento — envie o comprovante pago da taxa da perícia.",
      },
      {
        anyOf: "vencimento",
        msg: "Não encontramos a data de vencimento — confira se o comprovante está completo e legível.",
      },
      {
        anyOf: "beneficiario|favorecido",
        msg: "Não encontramos o beneficiário/favorecido da guia — o comprovante precisa identificar quem recebeu.",
      },
    ],
  },
};

/** Fallback para docTypes sem mapa específico: só confere o nome. */
export const OCR_DOCTYPE_DEFAULT: OcrDocHint = { keywords: [], exigeNome: true };

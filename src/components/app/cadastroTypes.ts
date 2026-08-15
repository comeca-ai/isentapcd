import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../api/router";
import type { Uf } from "@contracts/constants";
import { isoToDateBR, maskCEP, maskCPF, maskPhone } from "./masks";

/** Estado completo do assistente de cadastro (5 etapas + revisão). */

export interface CondutorForm {
  nome: string;
  cpf: string;
  parentesco: string;
  cnh: string;
}

export interface RepresentanteForm {
  tipo: "" | "pai" | "mae" | "tutor" | "curador";
  nome: string;
  cpf: string;
}

export interface WizardData {
  // Etapa 1 — dados pessoais
  cpf: string;
  telefone: string;
  uf: string;
  // Etapa 2 — deficiência e laudo
  disabilityType: string;
  teaNivel: string; // "1" | "2" | "3" | "nao_sei" | ""
  cid: string;
  temLaudo: string; // "recente" | "antigo" | "nenhum" | ""
  laudoEmissor: string;
  laudoDataBR: string;
  isDriver: string; // "sim" | "nao" | ""
  // Etapa 3 — CNH especial / condutores
  cnhSpecial: string; // "sim" | "nao" | "nao_sei" | ""
  condutores: CondutorForm[];
  temRepresentante: boolean;
  representante: RepresentanteForm;
  // Etapa 4 — endereço
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  endUf: string;
  // Etapa 5 — veículo pretendido
  intendedVehicleId: number | null;
  purchaseDateBR: string;
  plateFinalDigit: string; // "" | "0".."9"
}

export const EMPTY_CONDUTOR: CondutorForm = { nome: "", cpf: "", parentesco: "", cnh: "" };
export const EMPTY_REPRESENTANTE: RepresentanteForm = { tipo: "", nome: "", cpf: "" };

export const EMPTY_WIZARD: WizardData = {
  cpf: "",
  telefone: "",
  uf: "",
  disabilityType: "",
  teaNivel: "",
  cid: "",
  temLaudo: "",
  laudoEmissor: "",
  laudoDataBR: "",
  isDriver: "",
  cnhSpecial: "",
  condutores: [],
  temRepresentante: false,
  representante: EMPTY_REPRESENTANTE,
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  endUf: "",
  intendedVehicleId: null,
  purchaseDateBR: "",
  plateFinalDigit: "",
};

export type ProfileGet = inferRouterOutputs<AppRouter>["profile"]["get"];

interface LaudoInfoJson {
  temLaudo?: "recente" | "antigo" | "nenhum";
  cid?: string;
  emissor?: string;
  dataEmissao?: string;
  teaNivel?: 1 | 2 | 3;
}

interface CondutoresInfoJson {
  condutores?: { nome: string; cpf: string; parentesco?: string; cnh?: string }[];
  representante?: { tipo: "pai" | "mae" | "tutor" | "curador"; nome: string; cpf: string } | null;
}

interface EnderecoJson {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: Uf;
}

/** Pré-preenche o assistente a partir do perfil salvo no servidor. */
export function wizardFromProfile(profile: ProfileGet): WizardData {
  if (!profile) return EMPTY_WIZARD;
  const laudo = (profile.laudoInfo ?? {}) as LaudoInfoJson;
  const condutoresInfo = (profile.condutoresInfo ?? {}) as CondutoresInfoJson;
  const endereco = (profile.endereco ?? {}) as EnderecoJson;
  const condutores = (condutoresInfo.condutores ?? []).map((c) => ({
    nome: c.nome ?? "",
    cpf: maskCPF(c.cpf ?? ""),
    parentesco: c.parentesco ?? "",
    cnh: c.cnh ?? "",
  }));
  return {
    cpf: maskCPF(profile.cpf ?? ""),
    telefone: maskPhone(profile.telefone ?? ""),
    uf: profile.uf ?? "",
    disabilityType: profile.disabilityType ?? "",
    teaNivel: laudo.teaNivel ? String(laudo.teaNivel) : "",
    cid: laudo.cid ?? "",
    temLaudo: laudo.temLaudo ?? "",
    laudoEmissor: laudo.emissor ?? "",
    laudoDataBR: isoToDateBR(laudo.dataEmissao),
    isDriver:
      profile.isDriver === true ? "sim" : profile.isDriver === false ? "nao" : "",
    cnhSpecial:
      profile.cnhSpecial === true ? "sim" : profile.cnhSpecial === false ? "nao" : "",
    condutores,
    temRepresentante: Boolean(condutoresInfo.representante),
    representante: condutoresInfo.representante
      ? {
          tipo: condutoresInfo.representante.tipo,
          nome: condutoresInfo.representante.nome,
          cpf: maskCPF(condutoresInfo.representante.cpf),
        }
      : EMPTY_REPRESENTANTE,
    cep: maskCEP(endereco.cep ?? ""),
    logradouro: endereco.logradouro ?? "",
    numero: endereco.numero ?? "",
    complemento: endereco.complemento ?? "",
    bairro: endereco.bairro ?? "",
    cidade: endereco.cidade ?? "",
    endUf: endereco.uf ?? "",
    intendedVehicleId: profile.intendedVehicleId ?? null,
    purchaseDateBR: isoToDateBR(profile.purchaseDate),
    plateFinalDigit:
      profile.plateFinalDigit === null || profile.plateFinalDigit === undefined
        ? ""
        : String(profile.plateFinalDigit),
  };
}

import { describe, expect, it } from "vitest";
import { evaluateEligibility } from "./quiz";
import type { QuizAnswers } from "@contracts/constants";

const base: QuizAnswers = {
  paraQuem: "eu_condutor",
  uf: "SP",
  disabilityType: "fisica",
  laudoStatus: "recente",
  carroExistente: "nenhum",
  debitos: "nao",
  faixaPreco: "ate70",
};

describe("evaluateEligibility (dossiê regulatório)", () => {
  it("perfil limpo → elegível", () => {
    const r = evaluateEligibility(base);
    expect(r.status).toBe("elegivel");
    expect(r.pendencias).toHaveLength(0);
    expect(r.proximosPassos.join(" ")).toContain("IPI");
  });

  it("laudo antigo + débitos → pendências com texto humano", () => {
    const r = evaluateEligibility({ ...base, laudoStatus: "antigo", debitos: "sim" });
    expect(r.status).toBe("pendencias");
    expect(r.pendencias.length).toBeGreaterThanOrEqual(2);
    expect(r.pendencias.join(" ")).toContain("laudo");
    expect(r.pendencias.join(" ")).toContain("bloqueiam");
  });

  it("carência ativa (<2 anos) → não elegível no momento", () => {
    const r = evaluateEligibility({ ...base, carroExistente: "com_isencao", tempoIsencao: "menos2" });
    expect(r.status).toBe("nao_elegivel");
  });

  it("visão monocular → pendência de via judicial (nunca promessa administrativa)", () => {
    const r = evaluateEligibility({ ...base, disabilityType: "visual", visaoMonocular: true });
    expect(r.status).toBe("pendencias");
    expect(r.pendencias.join(" ")).toContain("judicial");
  });

  it("TEA nível 1 → pendência de grau (STF só vale 2027+)", () => {
    const r = evaluateEligibility({ ...base, disabilityType: "tea", teaSupportLevel: 1 });
    expect(r.status).toBe("pendencias");
    expect(r.pendencias.join(" ")).toContain("2027");
  });

  it("faixa 120–200 mil → pendência de teto de ICMS", () => {
    const r = evaluateEligibility({ ...base, faixaPreco: "120a200" });
    expect(r.status).toBe("pendencias");
    expect(r.pendencias.join(" ")).toContain("120");
  });
});

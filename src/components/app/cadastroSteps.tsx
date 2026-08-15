import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Accessibility,
  Brain,
  Ear,
  Eye,
  HelpCircle,
  Info,
  Layers,
  Loader2,
  Plus,
  Puzzle,
  Trash2,
} from "lucide-react";
import { FUEL_LABELS, UF_LIST } from "@contracts/constants";
import { trpc } from "@/providers/trpc";
import { formatBRL } from "@/lib/constants";
import { maskCEP, maskCPF, maskDateBR, maskPhone, onlyDigits } from "./masks";
import { RadioCards, SelectField, TextField } from "./FormField";
import type { CondutorForm, WizardData } from "./cadastroTypes";

/**
 * Etapas 1–5 do assistente de cadastro (design app-cadastro.md C2).
 * Cada etapa recebe `data`, `update` e o mapa de erros (validação no wizard).
 */

export interface StepProps {
  data: WizardData;
  update: (patch: Partial<WizardData>) => void;
  errors: Record<string, string>;
  userName?: string;
}

const UF_OPTIONS = UF_LIST.map((uf) => ({ value: uf, label: uf }));

const DISABILITY_OPTIONS = [
  { value: "fisica", label: "Física ou mobilidade", icon: <Accessibility className="h-5 w-5" /> },
  { value: "visual", label: "Visual", icon: <Eye className="h-5 w-5" /> },
  { value: "auditiva", label: "Auditiva", icon: <Ear className="h-5 w-5" /> },
  { value: "intelectual", label: "Intelectual", icon: <Brain className="h-5 w-5" /> },
  { value: "tea", label: "Autismo (TEA)", icon: <Puzzle className="h-5 w-5" /> },
  { value: "multipla", label: "Múltipla", icon: <Layers className="h-5 w-5" /> },
  { value: "outra", label: "Outra", icon: <HelpCircle className="h-5 w-5" /> },
];

function InfoBox({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  return (
    <div
      className={
        tone === "warn"
          ? "flex items-start gap-2 rounded-input border-[1.5px] border-warn/50 bg-warn/10 p-4 text-small text-txt"
          : "flex items-start gap-2 rounded-input border-[1.5px] border-success/40 bg-success/10 p-4 text-small text-txt"
      }
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/** Expansão suave de sub-perguntas condicionais (250ms, height auto). */
export function Conditional({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ── Etapa 1 — Quem é a pessoa com deficiência ──────────────────────────────
export function StepDadosPessoais({ data, update, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <InfoBox>
        Estes dados existem para montar seu processo. Nunca pedimos senha do Gov.br. Você pode
        apagar tudo em Conta → Excluir.
      </InfoBox>
      <TextField
        id="cad-cpf"
        label="CPF da pessoa com deficiência"
        hint="Só números; a gente formata para você. Usado nos protocolos da Receita e da Sefaz."
        required
        inputMode="numeric"
        autoComplete="off"
        placeholder="000.000.000-00"
        value={data.cpf}
        error={errors["cad-cpf"] ?? null}
        onChange={(v) => update({ cpf: maskCPF(v) })}
      />
      <TextField
        id="cad-telefone"
        label="Telefone / WhatsApp"
        hint="Com DDD. É por aqui que avisamos sobre cada etapa concluída."
        required
        inputMode="numeric"
        autoComplete="tel"
        placeholder="(00) 00000-0000"
        value={data.telefone}
        error={errors["cad-telefone"] ?? null}
        onChange={(v) => update({ telefone: maskPhone(v) })}
      />
      <SelectField
        id="cad-uf"
        label="Estado de residência"
        hint="As regras de ICMS e IPVA mudam por estado — isso define o seu mapa."
        required
        placeholder="Selecione a UF"
        options={UF_OPTIONS}
        value={data.uf}
        error={errors["cad-uf"] ?? null}
        onChange={(v) => update({ uf: v })}
      />
    </div>
  );
}

// ── Etapa 2 — Deficiência e laudo ──────────────────────────────────────────
export function StepDeficiencia({ data, update, errors }: StepProps) {
  const casoCinzento = data.disabilityType === "tea" && data.teaNivel === "1";
  return (
    <div className="flex flex-col gap-5">
      <RadioCards
        id="cad-disability"
        name="disabilityType"
        legend="Tipo de deficiência"
        hint="Como consta no laudo médico ou na avaliação."
        required
        columns={2}
        options={DISABILITY_OPTIONS}
        value={data.disabilityType}
        error={errors["cad-disability"] ?? null}
        onChange={(v) => update({ disabilityType: v })}
      />

      <Conditional show={data.disabilityType === "tea"}>
        <div className="pt-1">
          <RadioCards
            id="cad-tea-nivel"
            name="teaNivel"
            legend="Nível de suporte do TEA"
            hint="Está no relatório do especialista. Se não souber, marque “não sei”."
            columns={2}
            options={[
              { value: "1", label: "Nível 1", description: "Suporte leve" },
              { value: "2", label: "Nível 2", description: "Suporte substancial" },
              { value: "3", label: "Nível 3", description: "Suporte muito substancial" },
              { value: "nao_sei", label: "Não sei", description: "A gente ajuda a identificar" },
            ]}
            value={data.teaNivel}
            error={errors["cad-tea-nivel"] ?? null}
            onChange={(v) => update({ teaNivel: v })}
          />
        </div>
      </Conditional>

      <Conditional show={casoCinzento}>
        <div className="pt-1">
          <InfoBox tone="warn">
            Seu caso pode ser negado no administrativo e garantido na Justiça. Explicamos tudo
            antes — sem sustos.
          </InfoBox>
        </div>
      </Conditional>

      <TextField
        id="cad-cid"
        label="CID (opcional)"
        hint="Está no laudo; se não souber, deixe em branco."
        placeholder="Ex.: F84.0"
        value={data.cid}
        error={errors["cad-cid"] ?? null}
        onChange={(v) => update({ cid: v })}
      />

      <RadioCards
        id="cad-tem-laudo"
        name="temLaudo"
        legend="Você já tem laudo médico?"
        hint="O laudo precisa ter CID e conclusão funcional (o impacto na mobilidade ou na condução)."
        required
        options={[
          { value: "recente", label: "Sim, recente", description: "Emitido há menos de 12 meses" },
          { value: "antigo", label: "Sim, antigo", description: "Emitido há mais de 12 meses" },
          {
            value: "nenhum",
            label: "Não tenho",
            description: "Sem problema: seu mapa inclui como conseguir",
          },
        ]}
        value={data.temLaudo}
        error={errors["cad-tem-laudo"] ?? null}
        onChange={(v) => update({ temLaudo: v })}
      />

      <Conditional show={data.temLaudo === "recente" || data.temLaudo === "antigo"}>
        <div className="grid gap-5 pt-1 sm:grid-cols-2">
          <TextField
            id="cad-laudo-emissor"
            label="Quem emitiu o laudo (opcional)"
            hint="Ex.: SUS, clínica credenciada, médico particular."
            value={data.laudoEmissor}
            error={errors["cad-laudo-emissor"] ?? null}
            onChange={(v) => update({ laudoEmissor: v })}
          />
          <TextField
            id="cad-laudo-data"
            label="Data de emissão (opcional)"
            hint="Formato dia/mês/ano."
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            value={data.laudoDataBR}
            error={errors["cad-laudo-data"] ?? null}
            onChange={(v) => update({ laudoDataBR: maskDateBR(v) })}
          />
        </div>
      </Conditional>

      <RadioCards
        id="cad-is-driver"
        name="isDriver"
        legend="A pessoa com deficiência vai dirigir o carro?"
        hint="Isso define se o processo pede CNH especial ou condutores autorizados."
        required
        options={[
          { value: "sim", label: "Sim, ela vai dirigir" },
          { value: "nao", label: "Não, outra pessoa vai dirigir" },
        ]}
        value={data.isDriver}
        error={errors["cad-is-driver"] ?? null}
        onChange={(v) => update({ isDriver: v })}
      />
    </div>
  );
}

// ── Etapa 3 — CNH especial / condutores ────────────────────────────────────
export function StepCondutores({ data, update, errors, userName }: StepProps) {
  const setCondutor = (index: number, patch: Partial<CondutorForm>) => {
    const next = data.condutores.map((c, i) => (i === index ? { ...c, ...patch } : c));
    update({ condutores: next });
  };

  if (data.isDriver === "sim") {
    return (
      <div className="flex flex-col gap-5">
        <RadioCards
          id="cad-cnh-special"
          name="cnhSpecial"
          legend="A CNH tem observações/restrições (CNH especial)?"
          hint="Ex.: “Deve usar veículo automático”. Se não souber, marque “não sei”."
          columns={3}
          options={[
            { value: "sim", label: "Sim" },
            { value: "nao", label: "Não" },
            { value: "nao_sei", label: "Não sei" },
          ]}
          value={data.cnhSpecial}
          error={errors["cad-cnh-special"] ?? null}
          onChange={(v) => update({ cnhSpecial: v })}
        />
        <InfoBox>
          Desde 2025 o STJ decidiu que a restrição na CNH não pode ser exigida para o IPI. Alguns
          estados ainda pedem para ICMS/IPVA — seu mapa mostra o caso da sua UF.
        </InfoBox>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <InfoBox>
        Quem não dirige precisa indicar até 3 condutores autorizados (em geral familiares que
        moram na mesma cidade). Eles entram no pedido com nome, CPF e CNH.
      </InfoBox>

      {errors["cad-condutores"] ? (
        <p role="alert" className="text-small font-bold text-danger">
          {errors["cad-condutores"]}
        </p>
      ) : null}

      <ul className="flex flex-col gap-4" aria-label="Condutores autorizados">
        {data.condutores.map((condutor, index) => (
          <li
            key={index}
            className="flex flex-col gap-4 rounded-input border border-line bg-bg-alt/50 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-small font-bold text-txt">Condutor {index + 1}</h3>
              <button
                type="button"
                onClick={() =>
                  update({ condutores: data.condutores.filter((_, i) => i !== index) })
                }
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-btn px-2 text-small font-bold text-danger underline underline-offset-4"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remover
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id={`cad-condutor-${index}-nome`}
                label="Nome completo"
                required
                value={condutor.nome}
                error={errors[`cad-condutor-${index}-nome`] ?? null}
                onChange={(v) => setCondutor(index, { nome: v })}
              />
              <TextField
                id={`cad-condutor-${index}-cpf`}
                label="CPF"
                required
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={condutor.cpf}
                error={errors[`cad-condutor-${index}-cpf`] ?? null}
                onChange={(v) => setCondutor(index, { cpf: maskCPF(v) })}
              />
              <TextField
                id={`cad-condutor-${index}-parentesco`}
                label="Parentesco/relação (opcional)"
                hint="Ex.: mãe, cônjuge, cuidador."
                value={condutor.parentesco}
                error={errors[`cad-condutor-${index}-parentesco`] ?? null}
                onChange={(v) => setCondutor(index, { parentesco: v })}
              />
              <TextField
                id={`cad-condutor-${index}-cnh`}
                label="Nº da CNH (opcional)"
                value={condutor.cnh}
                error={errors[`cad-condutor-${index}-cnh`] ?? null}
                onChange={(v) => setCondutor(index, { cnh: v })}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {data.condutores.length < 3 ? (
          <button
            type="button"
            onClick={() =>
              update({
                condutores: [
                  ...data.condutores,
                  { nome: "", cpf: "", parentesco: "", cnh: "" },
                ],
              })
            }
            className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border-[1.5px] border-line bg-surface px-4 text-small font-bold text-txt transition-colors hover:border-accent"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Adicionar condutor
          </button>
        ) : null}
        {userName && data.condutores.length < 3 ? (
          <button
            type="button"
            onClick={() => {
              const exists = data.condutores.some((c) => c.nome === userName);
              if (!exists) {
                update({
                  condutores: [
                    ...data.condutores,
                    { nome: userName, cpf: "", parentesco: "eu mesmo(a)", cnh: "" },
                  ],
                });
              }
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border-[1.5px] border-line bg-surface px-4 text-small font-bold text-txt transition-colors hover:border-accent"
          >
            Sou eu
          </button>
        ) : null}
      </div>

      <div className="rounded-input border border-line p-4">
        <label className="flex min-h-[44px] items-start gap-3 text-small font-bold text-txt">
          <input
            type="checkbox"
            checked={data.temRepresentante}
            onChange={(e) => update({ temRepresentante: e.target.checked })}
            className="mt-0.5 h-6 w-6 shrink-0 accent-[#16724F]"
          />
          A pessoa com deficiência tem representante legal (menor de idade, tutor ou curador)
        </label>
        <Conditional show={data.temRepresentante}>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SelectField
              id="cad-rep-tipo"
              label="Quem é o representante"
              required
              placeholder="Selecione"
              options={[
                { value: "pai", label: "Pai" },
                { value: "mae", label: "Mãe" },
                { value: "tutor", label: "Tutor(a)" },
                { value: "curador", label: "Curador(a)" },
              ]}
              value={data.representante.tipo}
              error={errors["cad-rep-tipo"] ?? null}
              onChange={(v) =>
                update({
                  representante: {
                    ...data.representante,
                    tipo: v as WizardData["representante"]["tipo"],
                  },
                })
              }
            />
            <TextField
              id="cad-rep-nome"
              label="Nome completo do representante"
              required
              value={data.representante.nome}
              error={errors["cad-rep-nome"] ?? null}
              onChange={(v) =>
                update({ representante: { ...data.representante, nome: v } })
              }
            />
            <TextField
              id="cad-rep-cpf"
              label="CPF do representante"
              hint="O documento que comprova a representação entra em Meus documentos."
              required
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={data.representante.cpf}
              error={errors["cad-rep-cpf"] ?? null}
              onChange={(v) =>
                update({ representante: { ...data.representante, cpf: maskCPF(v) } })
              }
            />
          </div>
        </Conditional>
      </div>
    </div>
  );
}

// ── Etapa 4 — Endereço (CEP com autocomplete ViaCEP via proxy do backend) ──
export function StepEndereco({ data, update, errors }: StepProps) {
  const utils = trpc.useUtils();
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const lastLookup = useRef<string>("");

  useEffect(() => {
    const digits = onlyDigits(data.cep);
    if (digits.length !== 8 || digits === lastLookup.current) return;
    lastLookup.current = digits;
    let cancelled = false;
    setCepStatus("loading");
    utils.profile.lookupCep
      .fetch({ cep: digits })
      .then((addr) => {
        if (cancelled) return;
        setCepStatus("found");
        update({
          logradouro: addr.logradouro || data.logradouro,
          bairro: addr.bairro || data.bairro,
          cidade: addr.cidade || data.cidade,
          endUf: (addr.uf as string) || data.endUf,
        });
      })
      .catch(() => {
        if (!cancelled) setCepStatus("notfound");
      });
    return () => {
      cancelled = true;
    };
    // update é estável (setState funcional); reexecuta só quando o CEP muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.cep]);

  return (
    <div className="flex flex-col gap-5">
      <TextField
        id="cad-cep"
        label="CEP"
        hint="Ao terminar de digitar, buscamos o endereço automaticamente. Se não achar, preencha manualmente."
        required
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="00000-000"
        value={data.cep}
        error={errors["cad-cep"] ?? null}
        onChange={(v) => update({ cep: maskCEP(v) })}
      />
      <div aria-live="polite" className="min-h-[1.5rem]">
        {cepStatus === "loading" ? (
          <p role="status" className="flex items-center gap-2 text-small text-txt-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Buscando endereço…
          </p>
        ) : cepStatus === "found" ? (
          <p className="text-small font-bold text-success">
            Endereço encontrado — confira os campos abaixo.
          </p>
        ) : cepStatus === "notfound" ? (
          <p className="text-small text-txt-2">
            CEP não encontrado na base — preencha o endereço manualmente.
          </p>
        ) : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="cad-logradouro"
          label="Rua / avenida"
          autoComplete="address-line1"
          value={data.logradouro}
          error={errors["cad-logradouro"] ?? null}
          onChange={(v) => update({ logradouro: v })}
        />
        <TextField
          id="cad-numero"
          label="Número"
          inputMode="numeric"
          value={data.numero}
          error={errors["cad-numero"] ?? null}
          onChange={(v) => update({ numero: v })}
        />
        <TextField
          id="cad-complemento"
          label="Complemento (opcional)"
          value={data.complemento}
          error={errors["cad-complemento"] ?? null}
          onChange={(v) => update({ complemento: v })}
        />
        <TextField
          id="cad-bairro"
          label="Bairro"
          value={data.bairro}
          error={errors["cad-bairro"] ?? null}
          onChange={(v) => update({ bairro: v })}
        />
        <TextField
          id="cad-cidade"
          label="Cidade"
          autoComplete="address-level2"
          value={data.cidade}
          error={errors["cad-cidade"] ?? null}
          onChange={(v) => update({ cidade: v })}
        />
        <SelectField
          id="cad-enduf"
          label="UF do endereço"
          placeholder="Selecione"
          options={UF_OPTIONS}
          value={data.endUf}
          error={errors["cad-enduf"] ?? null}
          onChange={(v) => update({ endUf: v })}
        />
      </div>
    </div>
  );
}

// ── Etapa 5 — O carro ──────────────────────────────────────────────────────
export function StepVeiculo({ data, update, errors }: StepProps) {
  const vehicles = trpc.vehicles.list.useQuery(undefined, { retry: 1, staleTime: 300_000 });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-small font-bold text-txt">Modelo em mente? (opcional)</h3>
        <p className="mt-1 text-small text-txt-2">
          Pode mudar depois — serve para calcularmos sua economia e checar os tetos de isenção.
        </p>
        {vehicles.isLoading ? (
          <p role="status" className="mt-3 flex items-center gap-2 text-small text-txt-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Carregando catálogo…
          </p>
        ) : vehicles.isError ? (
          <p role="alert" className="mt-3 text-small text-txt-2">
            Não foi possível carregar o catálogo agora — você pode seguir sem escolher.
          </p>
        ) : (
          <RadioCards
            id="cad-veiculo"
            name="intendedVehicle"
            legend="Veículo pretendido"
            columns={2}
            options={[
              ...(vehicles.data ?? []).map((v) => ({
                value: String(v.id),
                label: v.nome,
                description: `${v.categoria} · ${FUEL_LABELS[v.combustivel]} · ${formatBRL(v.preco)}`,
              })),
              {
                value: "none",
                label: "Ainda não sei",
                description: "Vou decidir depois — sem problema",
              },
            ]}
            value={data.intendedVehicleId === null ? "none" : String(data.intendedVehicleId)}
            error={errors["cad-veiculo"] ?? null}
            onChange={(v) =>
              update({ intendedVehicleId: v === "none" ? null : Number(v) })
            }
          />
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="cad-purchase-date"
          label="Já comprou o carro? Data da compra (opcional)"
          hint="Se já comprou, a data da nota fiscal define os prazos pós-compra (ex.: apresentar a NF à Sefaz até o 15º dia útil)."
          inputMode="numeric"
          placeholder="DD/MM/AAAA"
          value={data.purchaseDateBR}
          error={errors["cad-purchase-date"] ?? null}
          onChange={(v) => update({ purchaseDateBR: maskDateBR(v) })}
        />
        <SelectField
          id="cad-plate"
          label="Final da placa do carro atual (opcional)"
          hint="Usado para lembretes de rodízio e IPVA. Deixe em branco se não tiver carro."
          placeholder="Selecione"
          options={Array.from({ length: 10 }, (_, i) => ({
            value: String(i),
            label: String(i),
          }))}
          value={data.plateFinalDigit}
          error={errors["cad-plate"] ?? null}
          onChange={(v) => update({ plateFinalDigit: v })}
        />
      </div>
    </div>
  );
}

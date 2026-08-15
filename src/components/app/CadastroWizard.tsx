import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import type { inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "../../../api/router";
import { UF_LIST } from "@contracts/constants";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import {
  cepError,
  cpfError,
  dateBRToISO,
  onlyDigits,
  phoneError,
} from "./masks";
import { ErrorSummary, type ErrorSummaryItem } from "./FormField";
import {
  EMPTY_WIZARD,
  wizardFromProfile,
  type WizardData,
} from "./cadastroTypes";
import {
  StepCondutores,
  StepDadosPessoais,
  StepDeficiencia,
  StepEndereco,
  StepVeiculo,
} from "./cadastroSteps";
import { CadastroReview } from "./CadastroReview";

/**
 * Assistente de cadastro multi-etapas (design app-cadastro.md):
 * 5 etapas + revisão, autosave por etapa (servidor) + rascunho local,
 * resumo de erros no topo e foco gerenciado entre etapas.
 */

type UpsertInput = inferRouterInputs<AppRouter>["profile"]["upsertStep"];

const STEP_TITLES = [
  "Quem é a pessoa com deficiência",
  "Deficiência e laudo",
  "Condutores",
  "Endereço",
  "O carro",
  "Revisão e confirmação",
] as const;

const DRAFT_KEY = "isentapcd:cadastro-draft";

interface Draft {
  data: WizardData;
  step: number;
  visited: number[];
  savedAt: string;
}

function loadDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ── Validação por etapa ────────────────────────────────────────────────────
function validateStep(step: number, data: WizardData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0) {
    const cpf = cpfError(data.cpf);
    if (cpf) errors["cad-cpf"] = cpf;
    const fone = phoneError(data.telefone);
    if (fone) errors["cad-telefone"] = fone;
    if (!data.uf) errors["cad-uf"] = "Escolha o estado de residência.";
  }
  if (step === 1) {
    if (!data.disabilityType) errors["cad-disability"] = "Escolha o tipo de deficiência.";
    if (!data.temLaudo) errors["cad-tem-laudo"] = "Diga se você já tem laudo médico.";
    if (!data.isDriver) errors["cad-is-driver"] = "Diga se a pessoa com deficiência vai dirigir.";
    if (data.laudoDataBR && !dateBRToISO(data.laudoDataBR)) {
      errors["cad-laudo-data"] = "Data do laudo inválida — use dia/mês/ano.";
    }
  }
  if (step === 2 && data.isDriver !== "sim") {
    if (data.condutores.length === 0) {
      errors["cad-condutores"] = "Adicione ao menos um condutor autorizado.";
    }
    data.condutores.forEach((c, i) => {
      if (c.nome.trim().length < 2) {
        errors[`cad-condutor-${i}-nome`] = `Informe o nome completo do condutor ${i + 1}.`;
      }
      const cpf = cpfError(c.cpf);
      if (cpf) errors[`cad-condutor-${i}-cpf`] = `Condutor ${i + 1}: ${cpf}`;
    });
    if (data.temRepresentante) {
      if (!data.representante.tipo) errors["cad-rep-tipo"] = "Escolha quem é o representante.";
      if (data.representante.nome.trim().length < 2) {
        errors["cad-rep-nome"] = "Informe o nome completo do representante.";
      }
      const cpf = cpfError(data.representante.cpf);
      if (cpf) errors["cad-rep-cpf"] = `Representante: ${cpf}`;
    }
  }
  if (step === 3) {
    const cep = cepError(data.cep);
    if (cep) errors["cad-cep"] = cep;
  }
  if (step === 4) {
    if (data.purchaseDateBR && !dateBRToISO(data.purchaseDateBR)) {
      errors["cad-purchase-date"] = "Data da compra inválida — use dia/mês/ano.";
    }
  }
  return errors;
}

// ── Payloads de salvamento (contrato profile.upsertStep) ───────────────────
function buildPayloads(step: number, data: WizardData): UpsertInput[] {
  const ufValida = (UF_LIST as readonly string[]).includes(data.uf);
  if (step === 0) {
    return [
      {
        step: 1,
        cpf: onlyDigits(data.cpf),
        telefone: onlyDigits(data.telefone) || undefined,
        uf: ufValida ? (data.uf as (typeof UF_LIST)[number]) : undefined,
      },
    ];
  }
  if (step === 1) {
    const teaNivel =
      data.teaNivel === "1" || data.teaNivel === "2" || data.teaNivel === "3"
        ? (Number(data.teaNivel) as 1 | 2 | 3)
        : undefined;
    return [
      {
        step: 2,
        disabilityType: data.disabilityType as
          | "fisica"
          | "visual"
          | "auditiva"
          | "intelectual"
          | "tea"
          | "multipla"
          | "outra",
        isDriver: data.isDriver === "sim",
        laudoInfo: {
          temLaudo: (data.temLaudo || undefined) as "recente" | "antigo" | "nenhum" | undefined,
          cid: data.cid || undefined,
          emissor: data.laudoEmissor || undefined,
          dataEmissao: dateBRToISO(data.laudoDataBR),
          teaNivel,
        },
      },
    ];
  }
  if (step === 2) {
    if (data.isDriver === "sim") {
      return [
        {
          step: 2,
          cnhSpecial:
            data.cnhSpecial === "sim" ? true : data.cnhSpecial === "nao" ? false : undefined,
        },
      ];
    }
    return [
      {
        step: 3,
        condutoresInfo: {
          condutores: data.condutores.map((c) => ({
            nome: c.nome.trim(),
            cpf: onlyDigits(c.cpf),
            parentesco: c.parentesco || undefined,
            cnh: c.cnh || undefined,
          })),
          representante: data.temRepresentante
            ? {
                tipo: data.representante.tipo as "pai" | "mae" | "tutor" | "curador",
                nome: data.representante.nome.trim(),
                cpf: onlyDigits(data.representante.cpf),
              }
            : null,
        },
      },
    ];
  }
  if (step === 3) {
    return [
      {
        step: 4,
        endereco: {
          cep: onlyDigits(data.cep),
          logradouro: data.logradouro || undefined,
          numero: data.numero || undefined,
          complemento: data.complemento || undefined,
          bairro: data.bairro || undefined,
          cidade: data.cidade || undefined,
          uf: (UF_LIST as readonly string[]).includes(data.endUf)
            ? (data.endUf as (typeof UF_LIST)[number])
            : undefined,
        },
      },
    ];
  }
  // step 4 — veículo
  return [
    {
      step: 4,
      intendedVehicleId: data.intendedVehicleId,
      purchaseDate: dateBRToISO(data.purchaseDateBR),
      plateFinalDigit: data.plateFinalDigit === "" ? null : Number(data.plateFinalDigit),
    },
  ];
}

// ── Stepper ────────────────────────────────────────────────────────────────
function CadastroStepper({
  step,
  visited,
  onGo,
}: {
  step: number;
  visited: number[];
  onGo: (index: number) => void;
}) {
  const pct = Math.round(((step + 1) / STEP_TITLES.length) * 100);
  return (
    <>
      {/* Mobile: barra de progresso + “Etapa X de 6” */}
      <div className="lg:hidden" aria-hidden="true">
        <p className="text-small font-bold text-txt">
          Etapa {step + 1} de {STEP_TITLES.length} — {STEP_TITLES[step]}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-alt">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      {/* Desktop: stepper horizontal clicável (apenas etapas já visitadas) */}
      <nav aria-label="Etapas do cadastro" className="hidden lg:block">
        <ol className="flex flex-wrap items-center gap-2">
          {STEP_TITLES.map((title, index) => {
            const isCurrent = index === step;
            const isVisited = visited.includes(index);
            const isDone = index < step;
            return (
              <li key={title} className="flex items-center gap-2">
                {index > 0 ? <span className="h-px w-4 bg-line" aria-hidden="true" /> : null}
                <button
                  type="button"
                  disabled={!isVisited || isCurrent}
                  onClick={() => onGo(index)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-small font-bold transition-colors",
                    isCurrent
                      ? "border-amber-600 bg-amber-600 text-white"
                      : isDone
                        ? "border-success/50 bg-success/10 text-success"
                        : isVisited
                          ? "border-line bg-surface text-txt hover:border-accent"
                          : "cursor-not-allowed border-line bg-bg-alt text-txt-2 opacity-60",
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                  {title}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

// ── Tela de sucesso ────────────────────────────────────────────────────────
function CadastroSucesso({ onEditAgain }: { onEditAgain: () => void }) {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <svg viewBox="0 0 64 64" className="h-20 w-20" role="img" aria-label="Cadastro confirmado">
        <circle cx="32" cy="32" r="30" className="fill-success/10 stroke-success" strokeWidth="3" />
        <motion.path
          d="M20 33 L28 41 L44 24"
          fill="none"
          className="stroke-success"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </svg>
      <h2 className="font-display text-h2 text-txt">Cadastro completo!</h2>
      <p className="max-w-prose68 text-body text-txt-2">
        Seu checklist de documentos já está pronto. Envie o primeiro arquivo e nossa equipe revisa
        antes de você protocolar.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/app/documentos"
          className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-accent px-8 text-body font-bold text-on-accent transition-colors hover:bg-accent-hover"
        >
          Ir para Meus documentos
        </Link>
        <button
          type="button"
          onClick={onEditAgain}
          className="inline-flex min-h-[44px] items-center rounded-btn border-[1.5px] border-line bg-surface px-5 text-small font-bold text-txt transition-colors hover:border-accent"
        >
          Editar cadastro
        </button>
      </div>
    </div>
  );
}

// ── Wizard ─────────────────────────────────────────────────────────────────
export function CadastroWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const utils = trpc.useUtils();
  const profile = trpc.profile.get.useQuery(undefined, { retry: 1 });
  const vehicles = trpc.vehicles.list.useQuery(undefined, { retry: 1, staleTime: 300_000 });

  const [initialized, setInitialized] = useState(false);
  const [data, setData] = useState<WizardData>(EMPTY_WIZARD);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [visited, setVisited] = useState<number[]>([0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [consentTermos, setConsentTermos] = useState(false);
  const [consentDados, setConsentDados] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const upsert = trpc.profile.upsertStep.useMutation();
  const submit = trpc.profile.submit.useMutation();

  // Inicialização: servidor vs rascunho local (o mais recente vence).
  // Padrão "estado derivado durante a renderização" (react.dev — evita cascata
  // de efeitos); os setStates abaixo re-renderizam este mesmo componente.
  if (!initialized && !profile.isLoading) {
    if (profile.isError) {
      setInitialized(true);
    } else {
      const p = profile.data ?? null;
      if (p?.completedAt) {
        setSubmitted(true);
        setData(wizardFromProfile(p));
        setInitialized(true);
      } else {
        const fromServer = wizardFromProfile(p);
        const serverStep = Math.min(Math.max(p?.formStep ?? 0, 0), 4);
        const draft = loadDraft();
        const serverUpdated = p?.updatedAt ? new Date(p.updatedAt).getTime() : 0;
        const draftAt = draft ? new Date(draft.savedAt).getTime() : 0;
        if (draft && draftAt > serverUpdated) {
          setData({ ...EMPTY_WIZARD, ...draft.data });
          setStep(Math.min(draft.step, STEP_TITLES.length - 1));
          setVisited(Array.from(new Set([...draft.visited, 0])));
        } else {
          setData(fromServer);
          setStep(serverStep);
          setVisited(Array.from({ length: serverStep + 1 }, (_, i) => i));
        }
        setInitialized(true);
      }
    }
  }

  // Rascunho local (debounce 800ms) — sair e voltar sem perder
  useEffect(() => {
    if (!initialized || submitted) return;
    const t = window.setTimeout(() => {
      const draft: Draft = {
        data,
        step,
        visited,
        savedAt: new Date().toISOString(),
      };
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftSavedAt(new Date());
      } catch {
        // armazenamento cheio/indisponível — o autosave do servidor continua
      }
    }, 800);
    return () => window.clearTimeout(t);
  }, [data, step, visited, initialized, submitted]);

  // Foco gerenciado: foca o heading da nova etapa
  useEffect(() => {
    if (!initialized || submitted) return;
    headingRef.current?.focus();
  }, [step, initialized, submitted]);

  const update = useCallback((patch: Partial<WizardData>) => {
    setData((cur) => ({ ...cur, ...patch }));
  }, []);

  const saveCurrentStep = useCallback(
    async (whichStep: number, current: WizardData): Promise<void> => {
      const payloads = buildPayloads(whichStep, current);
      for (const payload of payloads) {
        await upsert.mutateAsync(payload);
      }
      await utils.profile.get.invalidate();
    },
    [upsert, utils],
  );

  const errorItems = (errs: Record<string, string>): ErrorSummaryItem[] =>
    Object.entries(errs).map(([fieldId, message]) => ({ fieldId, message }));

  const showErrors = (errs: Record<string, string>, extra?: string) => {
    setErrors(errs);
    setServerError(extra ?? null);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const goTo = (index: number) => {
    setDirection(index > step ? 1 : -1);
    setErrors({});
    setServerError(null);
    setStep(index);
    setVisited((cur) => (cur.includes(index) ? cur : [...cur, index]));
  };

  const handleContinue = async () => {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length > 0) {
      showErrors(errs);
      return;
    }
    try {
      await saveCurrentStep(step, data);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível salvar — tente de novo.";
      showErrors({}, `Não foi possível salvar esta etapa: ${message}`);
      return;
    }
    goTo(step + 1);
  };

  const handleBack = () => {
    setErrors({});
    setServerError(null);
    goTo(step - 1);
  };

  const handleSaveAndExit = async () => {
    // salva o que for válido no servidor (rascunho local já está garantido)
    try {
      const errs = validateStep(step, data);
      if (Object.keys(errs).length === 0) {
        await saveCurrentStep(step, data);
      }
    } catch {
      // silencioso: o rascunho local preserva o preenchimento
    }
    navigate("/app");
  };

  const handleSubmit = async () => {
    setConsentError(null);
    setSubmitError(null);
    if (!consentTermos || !consentDados) {
      setConsentError("Marque os dois consentimentos para confirmar o cadastro.");
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    try {
      await saveCurrentStep(4, data); // garante a etapa do veículo salva
      await submit.mutateAsync();
      window.localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
      await utils.profile.get.invalidate();
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível confirmar — tente de novo.";
      setSubmitError(message);
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  };

  const vehicleName =
    data.intendedVehicleId !== null
      ? (vehicles.data ?? []).find((v) => v.id === data.intendedVehicleId)?.nome ?? null
      : null;

  const allErrorItems: ErrorSummaryItem[] = [
    ...errorItems(errors),
    ...(serverError ? [{ fieldId: "cadastro-step-heading", message: serverError }] : []),
    ...(consentError && step === 5
      ? [{ fieldId: consentTermos ? "cad-consent-dados" : "cad-consent-termos", message: consentError }]
      : []),
    ...(submitError ? [{ fieldId: "cadastro-step-heading", message: submitError }] : []),
  ];

  const stepContent = () => {
    const props = { data, update, errors, userName: user?.name };
    switch (step) {
      case 0:
        return <StepDadosPessoais {...props} />;
      case 1:
        return <StepDeficiencia {...props} />;
      case 2:
        return <StepCondutores {...props} />;
      case 3:
        return <StepEndereco {...props} />;
      case 4:
        return <StepVeiculo {...props} />;
      default:
        return (
          <CadastroReview
            data={data}
            vehicleName={vehicleName}
            consentTermos={consentTermos}
            consentDados={consentDados}
            onConsentTermos={setConsentTermos}
            onConsentDados={setConsentDados}
            consentError={consentError}
            submitError={submitError}
            submitting={submit.isPending}
            onEdit={(index) => goTo(index)}
            onSubmit={handleSubmit}
          />
        );
    }
  };

  if (profile.isLoading || !initialized) {
    return (
      <div role="status" className="flex items-center gap-2 py-16 text-small text-txt-2">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Carregando seu cadastro…
      </div>
    );
  }

  if (profile.isError) {
    return (
      <div
        role="alert"
        className="my-8 flex flex-wrap items-center gap-3 rounded-input border-[1.5px] border-danger bg-surface p-4"
      >
        <p className="text-small font-bold text-txt">
          Não foi possível carregar seu cadastro.
        </p>
        <button
          type="button"
          onClick={() => {
            setInitialized(false);
            profile.refetch();
          }}
          className="min-h-[44px] rounded-btn border-[1.5px] border-line px-4 text-small font-bold text-txt hover:border-accent"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <CadastroSucesso
        onEditAgain={() => {
          setSubmitted(false);
          goTo(0);
        }}
      />
    );
  }

  const isReview = step === 5;

  return (
    <div className="flex flex-col gap-6">
      <CadastroStepper step={step} visited={visited} onGo={goTo} />

      <div className="rounded-card border border-line bg-surface p-6 shadow-card-light sm:p-10">
        {allErrorItems.length > 0 ? (
          <div className="mb-5">
            <ErrorSummary ref={summaryRef} errors={allErrorItems} />
          </div>
        ) : (
          // mantém o resumo focável mesmo vazio para o foco não se perder
          <div ref={summaryRef} tabIndex={-1} className="sr-only" aria-live="assertive" />
        )}

        <h2
          ref={headingRef}
          id="cadastro-step-heading"
          tabIndex={-1}
          className="font-display text-h2 text-txt focus:outline-none"
        >
          {STEP_TITLES[step]}
        </h2>

        <div className="mt-6">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 40 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -40 * direction }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {stepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Rodapé fixo do card: voltar / salvar e sair / continuar + autosave */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border-[1.5px] border-line bg-surface px-4 text-small font-bold text-txt transition-colors hover:border-accent"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSaveAndExit}
            className="inline-flex min-h-[44px] items-center rounded-btn px-3 text-small font-bold text-txt-2 underline underline-offset-4"
          >
            Salvar e sair
          </button>
          <span className="flex-1" />
          <span className="font-mono text-mono text-txt-2" role="status" aria-live="polite">
            {upsert.isPending
              ? "Salvando…"
              : draftSavedAt
                ? `Rascunho salvo às ${draftSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
          </span>
          {!isReview ? (
            <button
              type="button"
              onClick={handleContinue}
              disabled={upsert.isPending}
              className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-accent px-6 text-body font-bold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {upsert.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : null}
              Continuar
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

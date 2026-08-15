import { motion } from "framer-motion";
import { CheckCircle2, FileText, Loader2, Map, Pencil } from "lucide-react";
import { UF_LIST } from "@contracts/constants";
import { CheckboxField } from "./FormField";
import type { WizardData } from "./cadastroTypes";

/**
 * Etapa final — revisão e confirmação (design app-cadastro.md C2 etapa 5):
 * resumo em description list por etapa com botão "Editar", checklist do que
 * destrava, consentimentos LGPD e botão "Confirmar cadastro".
 */

const DISABILITY_LABELS: Record<string, string> = {
  fisica: "Física ou mobilidade",
  visual: "Visual",
  auditiva: "Auditiva",
  intelectual: "Intelectual",
  tea: "Autismo (TEA)",
  multipla: "Múltipla",
  outra: "Outra",
};

const TEA_LABELS: Record<string, string> = {
  "1": "Nível 1",
  "2": "Nível 2",
  "3": "Nível 3",
  nao_sei: "Não sei",
};

const LAUDO_LABELS: Record<string, string> = {
  recente: "Sim, recente",
  antigo: "Sim, antigo",
  nenhum: "Não tenho",
};

const REP_TIPO_LABELS: Record<string, string> = {
  pai: "Pai",
  mae: "Mãe",
  tutor: "Tutor(a)",
  curador: "Curador(a)",
};

function show(value: string | null | undefined): string {
  return value && value.trim() !== "" ? value : "—";
}

function ReviewBlock({
  title,
  stepIndex,
  onEdit,
  rows,
}: {
  title: string;
  stepIndex: number;
  onEdit: (step: number) => void;
  rows: [string, string][];
}) {
  return (
    <section className="rounded-input border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-small font-bold text-txt">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(stepIndex)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-btn px-2 text-small font-bold text-accent underline underline-offset-4"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar
        </button>
      </div>
      <dl className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map(([term, value]) => (
          <div key={term}>
            <dt className="text-small text-txt-2">{term}</dt>
            <dd className="text-small font-bold text-txt">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export interface CadastroReviewProps {
  data: WizardData;
  vehicleName: string | null;
  consentTermos: boolean;
  consentDados: boolean;
  onConsentTermos: (v: boolean) => void;
  onConsentDados: (v: boolean) => void;
  consentError: string | null;
  submitError: string | null;
  submitting: boolean;
  onEdit: (stepIndex: number) => void;
  onSubmit: () => void;
}

export function CadastroReview({
  data,
  vehicleName,
  consentTermos,
  consentDados,
  onConsentTermos,
  onConsentDados,
  consentError,
  submitError,
  submitting,
  onEdit,
  onSubmit,
}: CadastroReviewProps) {
  const condutoresResumo =
    data.isDriver === "sim"
      ? data.cnhSpecial === "sim"
        ? "A própria pessoa com deficiência · CNH com restrições"
        : data.cnhSpecial === "nao"
          ? "A própria pessoa com deficiência · CNH sem restrições"
          : "A própria pessoa com deficiência"
      : data.condutores.length > 0
        ? data.condutores
            .map((c) => c.nome)
            .filter(Boolean)
            .join(", ") || "—"
        : "—";

  return (
    <div className="flex flex-col gap-5">
      <ReviewBlock
        title="Quem é a pessoa com deficiência"
        stepIndex={0}
        onEdit={onEdit}
        rows={[
          ["CPF", show(data.cpf)],
          ["Telefone/WhatsApp", show(data.telefone)],
          ["Estado de residência", show(data.uf)],
        ]}
      />
      <ReviewBlock
        title="Deficiência e laudo"
        stepIndex={1}
        onEdit={onEdit}
        rows={[
          ["Tipo de deficiência", show(DISABILITY_LABELS[data.disabilityType])],
          ...(data.disabilityType === "tea"
            ? ([["Nível de suporte", show(TEA_LABELS[data.teaNivel])]] as [string, string][])
            : []),
          ["CID", show(data.cid)],
          ["Laudo médico", show(LAUDO_LABELS[data.temLaudo])],
          ["Vai dirigir", data.isDriver === "sim" ? "Sim" : data.isDriver === "nao" ? "Não" : "—"],
        ]}
      />
      <ReviewBlock
        title="Condutores"
        stepIndex={2}
        onEdit={onEdit}
        rows={[
          ["Quem dirige", condutoresResumo],
          ...(data.temRepresentante && data.representante.nome
            ? ([
                [
                  "Representante legal",
                  `${REP_TIPO_LABELS[data.representante.tipo] ?? ""} · ${data.representante.nome} · ${data.representante.cpf}`,
                ],
              ] as [string, string][])
            : []),
        ]}
      />
      <ReviewBlock
        title="Endereço"
        stepIndex={3}
        onEdit={onEdit}
        rows={[
          ["CEP", show(data.cep)],
          [
            "Endereço",
            show(
              [data.logradouro, data.numero, data.complemento, data.bairro, data.cidade, data.endUf]
                .filter((p) => p && p.trim() !== "")
                .join(", "),
            ),
          ],
        ]}
      />
      <ReviewBlock
        title="O carro"
        stepIndex={4}
        onEdit={onEdit}
        rows={[
          ["Veículo pretendido", vehicleName ?? "Ainda não sei"],
          ["Data da compra", show(data.purchaseDateBR)],
          ["Final da placa atual", show(data.plateFinalDigit)],
        ]}
      />

      {/* O que isso destrava */}
      <div className="rounded-input border border-success/40 bg-success/10 p-4">
        <h3 className="text-small font-bold text-txt">Com seu cadastro completo, montamos:</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {[
            { icon: FileText, text: "checklist de documentos exato do seu caso" },
            { icon: Map, text: "textos de protocolo para Receita e Sefaz" },
            { icon: CheckCircle2, text: "prazos e lembretes do seu caso" },
          ].map(({ icon: Icon, text }, i) => (
            <motion.li
              key={text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.3 }}
              className="flex items-center gap-2 text-small text-txt"
            >
              <Icon className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              {text}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Consentimentos (desmarcados por padrão — LGPD) */}
      <div className="flex flex-col gap-4 rounded-input border border-line p-4">
        <CheckboxField
          id="cad-consent-termos"
          checked={consentTermos}
          onChange={onConsentTermos}
          error={consentError && !consentTermos ? consentError : null}
          label={
            <>
              Li e aceito os{" "}
              <a href="/termos" className="font-bold underline underline-offset-2" target="_blank" rel="noreferrer">
                Termos de uso
              </a>
              .
            </>
          }
        />
        <CheckboxField
          id="cad-consent-dados"
          checked={consentDados}
          onChange={onConsentDados}
          error={consentError && consentTermos && !consentDados ? consentError : null}
          label={
            <>
              Autorizo o tratamento dos meus dados sensíveis (saúde) para montar meu processo,
              conforme a{" "}
              <a href="/privacidade" className="font-bold underline underline-offset-2" target="_blank" rel="noreferrer">
                Política de privacidade
              </a>{" "}
              (LGPD). Posso apagar tudo depois em Conta → Excluir.
            </>
          }
        />
      </div>

      {submitError ? (
        <p role="alert" className="text-small font-bold text-danger">
          {submitError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="inline-flex min-h-[52px] items-center justify-center gap-2 self-start rounded-btn bg-accent px-8 text-body font-bold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        )}
        Confirmar cadastro
      </button>

      <p className="text-small text-txt-2">
        Estado de residência informado: {show(data.uf)} — as regras de ICMS/IPVA seguem a UF acima
        ({UF_LIST.length} UFs cobertas).
      </p>
    </div>
  );
}

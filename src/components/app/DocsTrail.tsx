import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Car,
  CheckCircle2,
  Clock,
  FileBadge,
  FileCheck,
  FileText,
  Home,
  Hourglass,
  IdCard,
  Loader2,
  Receipt,
  RefreshCw,
  ScanSearch,
  Stethoscope,
  Upload,
  Wallet,
} from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../api/router";
import { DOC_TRAIL } from "@contracts/constants";
import { cn } from "@/lib/utils";
import { formatDateTime } from "./masks";
import { DocUploadZone, type UploadPayload } from "./DocUploadZone";
import type { DocUploadMeta } from "./DocsChecklist";

export type Checklist = inferRouterOutputs<AppRouter>["documents"]["checklist"];
export type ChecklistDoc = Checklist[number]["docs"][number];

const DOC_ICONS: Record<string, typeof FileText> = {
  doc_identidade: IdCard,
  cpf: IdCard,
  laudo_medico: Stethoscope,
  comprovante_residencia: Home,
  declaracao_disponibilidade: Wallet,
  autorizacao_ipi: BadgeCheck,
  requerimento_icms: FileText,
  comprovante_domicilio_estadual: Home,
  declaracao_quitacao: FileCheck,
  cnh_condutores: Car,
  autorizacao_icms: BadgeCheck,
  laudo_pericial_detran: Stethoscope,
  cnh_restricao: Car,
  nf_compra: Receipt,
  crlv: Car,
  nf_adaptacao: Receipt,
  csv: FileBadge,
  guia_taxa_estadual: Receipt,
  guia_pericia: Receipt,
};

/** Achados do OCR (ocrSummary é JSON string[]; tolerante a formato antigo). */
function parseOcrFindings(summary: string | null): string[] {
  if (!summary) return [];
  try {
    const parsed = JSON.parse(summary) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((s): s is string => typeof s === "string");
    return [summary];
  } catch {
    return [summary];
  }
}

type StepState =
  | "a_enviar"
  | "analisando"
  | "verificado"
  | "atencao"
  | "aprovado"
  | "rejeitado"
  | "enviado"
  | "ocr_falhou";

function stepState(upload: DocUploadMeta | null): StepState {
  if (!upload) return "a_enviar";
  if (upload.status === "rejected") return "rejeitado";
  if (upload.status === "approved") return "aprovado";
  switch (upload.ocrStatus) {
    case "processing":
      return "analisando";
    case "ok":
      return "verificado";
    case "attention":
      return "atencao";
    case "failed":
      return "ocr_falhou";
    default:
      return "enviado";
  }
}

/** Badge sempre com ícone + texto (design.md §8.8), nunca só cor. */
function StepBadge({ state }: { state: StepState }) {
  switch (state) {
    case "aprovado":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-small font-bold text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Aprovado pelo time
        </span>
      );
    case "rejeitado":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger/10 px-3 py-1 text-small font-bold text-danger">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Rejeitado
        </span>
      );
    case "analisando":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-small font-bold text-warn">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Enviado — analisando…
        </span>
      );
    case "verificado":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-moss-600/40 bg-moss-400/10 px-3 py-1 text-small font-bold text-moss-600">
          <ScanSearch className="h-4 w-4" aria-hidden="true" />
          Verificado automaticamente
        </span>
      );
    case "atencao":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-coral-600/50 bg-coral-400/10 px-3 py-1 text-small font-bold text-coral-600">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Precisa de atenção
        </span>
      );
    case "ocr_falhou":
    case "enviado":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-small font-bold text-warn">
          <Hourglass className="h-4 w-4" aria-hidden="true" />
          Enviado — aguardando revisão
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-alt px-3 py-1 text-small font-bold text-txt-2">
          <Clock className="h-4 w-4" aria-hidden="true" />
          A enviar
        </span>
      );
  }
}

interface TrailStepProps {
  step: number;
  doc: ChecklistDoc;
  phase: string;
  flash: boolean;
  uploadOpen: boolean;
  onOpenUpload: () => void;
  onCloseUpload: () => void;
  onUpload: (payload: UploadPayload) => Promise<void>;
  onOpenDetail: (upload: DocUploadMeta, label: string) => void;
  onReprocess: (upload: DocUploadMeta) => void;
  reprocessing: boolean;
  itemRef: (el: HTMLLIElement | null) => void;
}

function TrailStep({
  step,
  doc,
  phase,
  flash,
  uploadOpen,
  onOpenUpload,
  onCloseUpload,
  onUpload,
  onOpenDetail,
  onReprocess,
  reprocessing,
  itemRef,
}: TrailStepProps) {
  const Icon = DOC_ICONS[doc.docType] ?? FileText;
  const upload = doc.upload;
  const state = stepState(upload);
  const findings = state === "atencao" ? parseOcrFindings(upload?.ocrSummary ?? null) : [];
  const needsAction = state === "a_enviar" || state === "rejeitado" || state === "atencao";

  return (
    <motion.li
      ref={itemRef}
      id={`docs-item-${doc.docType}`}
      tabIndex={-1}
      animate={{
        backgroundColor: flash
          ? ["rgba(22,114,79,0)", "rgba(22,114,79,0.14)", "rgba(22,114,79,0)"]
          : "rgba(22,114,79,0)",
      }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={cn(
        "rounded-card border bg-surface p-4 focus:outline-none sm:p-5",
        state === "atencao" ? "border-coral-600/50" : "border-line",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        {/* Número do passo */}
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-input border font-mono text-mono font-bold",
            state === "a_enviar"
              ? "border-line bg-bg-alt text-txt-2"
              : "border-success/40 bg-success/10 text-success",
          )}
          aria-label={`Passo ${step}`}
        >
          {state === "a_enviar" ? step : <Icon className="h-5 w-5 text-accent" aria-hidden="true" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-display text-body font-medium text-txt">
              {step}. {doc.label}
            </h3>
            {doc.conditional ? (
              <span className="rounded-full border border-line px-2.5 py-0.5 text-mono text-txt-2">
                conforme seu caso
              </span>
            ) : null}
            <span className="rounded-full border border-line px-2.5 py-0.5 text-mono text-txt-2">
              {phase}
            </span>
          </div>
          <p className="mt-1 text-small text-txt-2">
            <span className="font-bold">Para que serve:</span> {doc.hint}
          </p>

          {upload ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-txt-2">
              <button
                type="button"
                onClick={() => onOpenDetail(upload, doc.label)}
                className="min-h-[44px] font-bold text-accent underline underline-offset-4"
              >
                {upload.fileName}
              </button>
              <span className="font-mono text-mono">
                v{upload.version} · enviado em {formatDateTime(upload.createdAt)}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-small text-txt-2">PDF ou foto nítida (JPG/PNG) · até 5 MB.</p>
          )}

          {/* Achados do OCR (atenção) */}
          {state === "atencao" && findings.length > 0 ? (
            <div className="mt-2 rounded-input border-[1.5px] border-coral-600/50 bg-coral-400/10 p-3">
              <p className="flex items-start gap-1.5 text-small font-bold text-coral-600">
                <ScanSearch className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Nossa leitura automática encontrou pontos de atenção:
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-6 text-small text-txt">
                {findings.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <p className="mt-1.5 text-small text-txt-2">
                Isso não é uma rejeição — corrija e reenvie, ou aguarde a revisão do time.
              </p>
            </div>
          ) : null}

          {/* Motivo da rejeição humana */}
          {state === "rejeitado" && upload?.rejectionReason ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-input border-[1.5px] border-danger/50 bg-danger/5 p-3 text-small text-txt">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              <span>
                <span className="font-bold text-danger">Motivo da rejeição: </span>
                {upload.rejectionReason}
              </span>
            </p>
          ) : null}

          {/* OCR falhou — não trava o fluxo */}
          {state === "ocr_falhou" ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-txt-2">
              <span>
                A análise automática não concluiu desta vez — sem problema, o time revisa
                manualmente.
              </span>
              <button
                type="button"
                onClick={() => upload && onReprocess(upload)}
                disabled={reprocessing}
                className="inline-flex min-h-[44px] items-center gap-1.5 font-bold text-accent underline underline-offset-4 disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", reprocessing && "animate-spin")} aria-hidden="true" />
                Tentar análise de novo
              </button>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <StepBadge state={state} />
          {needsAction && !uploadOpen ? (
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-4 text-small font-bold text-on-accent transition-colors hover:bg-accent-hover"
            >
              {state === "a_enviar" ? (
                <>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Enviar arquivo
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Reenviar
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {uploadOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4">
              <DocUploadZone
                docType={doc.docType}
                docLabel={doc.label}
                onUpload={(_docType, payload) => onUpload(payload)}
                onCancel={onCloseUpload}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

interface DocsTrailProps {
  groups: Checklist;
  uploadTarget: string | null;
  onOpenUpload: (docType: string) => void;
  onCloseUpload: () => void;
  onUpload: (docType: string, payload: UploadPayload) => Promise<void>;
  onOpenDetail: (upload: DocUploadMeta, label: string) => void;
  onReprocess: (upload: DocUploadMeta) => void;
  reprocessingId: number | null;
}

/**
 * Trilha guiada (POC v3): sequência numerada única na ordem lógica do
 * processo (DOC_TRAIL), reaproveitando DocUploadZone + drawer de detalhe.
 */
export function DocsTrail({
  groups,
  uploadTarget,
  onOpenUpload,
  onCloseUpload,
  onUpload,
  onOpenDetail,
  onReprocess,
  reprocessingId,
}: DocsTrailProps) {
  const [flashDoc, setFlashDoc] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  const byType = new Map(groups.flatMap((g) => g.docs.map((d) => [d.docType, d] as const)));

  const handleUpload = async (docType: string, payload: UploadPayload) => {
    await onUpload(docType, payload);
    onCloseUpload();
    setFlashDoc(docType);
    window.setTimeout(() => setFlashDoc((cur) => (cur === docType ? null : cur)), 900);
    requestAnimationFrame(() => itemRefs.current.get(docType)?.focus());
  };

  // Sequência numerada única, achatada na ordem lógica do processo (DOC_TRAIL)
  const steps = DOC_TRAIL.flatMap(({ phase, docTypes }) =>
    docTypes.flatMap((docType) => {
      const doc = byType.get(docType);
      return doc ? [{ phase, doc }] : [];
    }),
  );

  return (
    <ol className="flex flex-col gap-3" aria-label="Trilha de envio de documentos">
      {steps.map(({ phase, doc }, idx) => {
          const step = idx + 1;
          return (
            <TrailStep
              key={doc.docType}
              step={step}
              doc={doc}
              phase={phase}
              flash={flashDoc === doc.docType}
              uploadOpen={uploadTarget === doc.docType}
              onOpenUpload={() => onOpenUpload(doc.docType)}
              onCloseUpload={onCloseUpload}
              onUpload={(payload) => handleUpload(doc.docType, payload)}
              onOpenDetail={onOpenDetail}
              onReprocess={onReprocess}
              reprocessing={reprocessingId !== null && doc.upload?.id === reprocessingId}
              itemRef={(el) => {
                if (el) itemRefs.current.set(doc.docType, el);
                else itemRefs.current.delete(doc.docType);
              }}
            />
          );
        })}
    </ol>
  );
}

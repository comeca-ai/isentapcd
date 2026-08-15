import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Car,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileBadge,
  FileCheck,
  FileText,
  Home,
  Hourglass,
  IdCard,
  Receipt,
  RefreshCw,
  Stethoscope,
  Upload,
  Wallet,
} from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../api/router";
import { cn } from "@/lib/utils";
import { formatDateTime } from "./masks";
import { DocUploadZone, type UploadPayload } from "./DocUploadZone";

export type Checklist = inferRouterOutputs<AppRouter>["documents"]["checklist"];
export type ChecklistDoc = Checklist[number]["docs"][number];
export type DocUploadMeta = NonNullable<ChecklistDoc["upload"]>;

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

/** Status sempre com ícone + texto (design.md §8.8), nunca só cor. */
export function DocStatusBadge({ upload }: { upload: DocUploadMeta | null }) {
  if (!upload) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-alt px-3 py-1 text-small font-bold text-txt-2">
        <Clock className="h-4 w-4" aria-hidden="true" />
        Pendente
      </span>
    );
  }
  switch (upload.status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-small font-bold text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Aprovado
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger/10 px-3 py-1 text-small font-bold text-danger">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Rejeitado
        </span>
      );
    case "in_review":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-small font-bold text-warn">
          <Hourglass className="h-4 w-4" aria-hidden="true" />
          Em revisão
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-small font-bold text-warn">
          <Clock className="h-4 w-4" aria-hidden="true" />
          Enviado — aguardando revisão
        </span>
      );
  }
}

interface DocItemProps {
  doc: ChecklistDoc;
  groupTitle: string | null;
  flash: boolean;
  uploadOpen: boolean;
  onOpenUpload: () => void;
  onCloseUpload: () => void;
  onUpload: (payload: UploadPayload) => Promise<void>;
  onOpenDetail: (upload: DocUploadMeta, label: string) => void;
  itemRef: (el: HTMLLIElement | null) => void;
}

function DocItem({
  doc,
  groupTitle,
  flash,
  uploadOpen,
  onOpenUpload,
  onCloseUpload,
  onUpload,
  onOpenDetail,
  itemRef,
}: DocItemProps) {
  const Icon = DOC_ICONS[doc.docType] ?? FileText;
  const upload = doc.upload;
  const needsAction = !upload || upload.status === "rejected";

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
      className="rounded-card border border-line bg-surface p-4 focus:outline-none sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input border border-line bg-bg-alt"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5 text-accent" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-display text-body font-medium text-txt">{doc.label}</h3>
            {doc.conditional ? (
              <span className="rounded-full border border-line px-2.5 py-0.5 text-mono text-txt-2">
                conforme seu caso
              </span>
            ) : null}
            {groupTitle ? (
              <span className="rounded-full border border-line px-2.5 py-0.5 text-mono text-txt-2">
                {groupTitle}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-small text-txt-2">
            <span className="font-bold">Para que serve:</span> {doc.hint}
          </p>
          <p className="mt-1 text-small text-txt-2">PDF ou foto nítida (JPG/PNG) · até 5 MB.</p>

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
          ) : null}

          {upload?.status === "rejected" && upload.rejectionReason ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-input border-[1.5px] border-danger/50 bg-danger/5 p-3 text-small text-txt">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              <span>
                <span className="font-bold text-danger">Motivo da rejeição: </span>
                {upload.rejectionReason}
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <DocStatusBadge upload={upload} />
          {needsAction && !uploadOpen ? (
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-4 text-small font-bold text-on-accent transition-colors hover:bg-accent-hover"
            >
              {upload?.status === "rejected" ? (
                <>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Reenviar
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Enviar arquivo
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

interface DocsChecklistProps {
  groups: Checklist;
  /** "org" = acordeões por órgão; "flat" = lista única (design DO1). */
  view: "org" | "flat";
  uploadTarget: string | null;
  onOpenUpload: (docType: string) => void;
  onCloseUpload: () => void;
  onUpload: (docType: string, payload: UploadPayload) => Promise<void>;
  onOpenDetail: (upload: DocUploadMeta, label: string) => void;
}

export function DocsChecklist({
  groups,
  view,
  uploadTarget,
  onOpenUpload,
  onCloseUpload,
  onUpload,
  onOpenDetail,
}: DocsChecklistProps) {
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const [flashDoc, setFlashDoc] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  const handleUpload = async (docType: string, payload: UploadPayload) => {
    await onUpload(docType, payload);
    // sucesso: fecha a zona, faz o flash musgo e devolve o foco ao item
    onCloseUpload();
    setFlashDoc(docType);
    window.setTimeout(() => setFlashDoc((cur) => (cur === docType ? null : cur)), 900);
    requestAnimationFrame(() => itemRefs.current.get(docType)?.focus());
  };

  const renderDoc = (doc: ChecklistDoc, groupTitle: string | null) => (
    <DocItem
      key={doc.docType}
      doc={doc}
      groupTitle={groupTitle}
      flash={flashDoc === doc.docType}
      uploadOpen={uploadTarget === doc.docType}
      onOpenUpload={() => onOpenUpload(doc.docType)}
      onCloseUpload={onCloseUpload}
      onUpload={(payload) => handleUpload(doc.docType, payload)}
      onOpenDetail={onOpenDetail}
      itemRef={(el) => {
        if (el) itemRefs.current.set(doc.docType, el);
        else itemRefs.current.delete(doc.docType);
      }}
    />
  );

  if (view === "flat") {
    const allDocs = groups.flatMap((g) => g.docs.map((d) => ({ doc: d, group: g })));
    return (
      <ul className="flex flex-col gap-3" aria-label="Todos os documentos">
        {allDocs.map(({ doc, group }) => renderDoc(doc, group.title))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => {
        const total = group.docs.length;
        const sent = group.docs.filter((d) => d.upload).length;
        const approved = group.docs.filter((d) => d.upload?.status === "approved").length;
        const rejected = group.docs.filter((d) => d.upload?.status === "rejected").length;
        const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
        const open = !closedGroups[group.key];
        const contentId = `docsgroup-${group.key}`;

        return (
          <section
            key={group.key}
            className="overflow-hidden rounded-card border border-line bg-surface"
          >
            <h2>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={contentId}
                onClick={() =>
                  setClosedGroups((cur) => ({ ...cur, [group.key]: !cur[group.key] }))
                }
                className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-h3 text-txt">{group.title}</span>
                  <span className="mt-0.5 block text-small text-txt-2">{group.org}</span>
                  <span className="mt-2 flex items-center gap-2" aria-hidden="true">
                    <span className="h-1.5 w-28 overflow-hidden rounded-full bg-bg-alt">
                      <motion.span
                        className="block h-full rounded-full bg-success"
                        initial={false}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {rejected > 0 ? (
                    <span role="img" aria-label={`${rejected} documento(s) para corrigir`}>
                      <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
                    </span>
                  ) : approved === total && total > 0 ? (
                    <span role="img" aria-label="Grupo completo e aprovado">
                      <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                    </span>
                  ) : null}
                  <span className="font-mono text-mono text-txt-2" aria-label={`${sent} de ${total} enviados`}>
                    {sent}/{total}
                  </span>
                  <ChevronDown
                    className={cn("h-5 w-5 text-txt-2 transition-transform", open && "rotate-180")}
                    aria-hidden="true"
                  />
                </span>
              </button>
            </h2>
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  id={contentId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <ul
                    className="flex flex-col gap-3 border-t border-line p-4 sm:p-5"
                    aria-label={`Documentos: ${group.title}`}
                  >
                    {group.docs.map((doc) => renderDoc(doc, null))}
                  </ul>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>
        );
      })}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { base64ToObjectURL, formatBytes, formatDateTime } from "./masks";
import { DocStatusBadge, type DocUploadMeta } from "./DocsChecklist";

/**
 * Drawer lateral (480px) com detalhe do documento (design app-documentos.md DO5):
 * preview (imagem/PDF), metadados, histórico de versões, comentário da revisão,
 * baixar, substituir e excluir (LGPD). Focus trap + ESC fecha.
 */

interface DocDetailDrawerProps {
  doc: DocUploadMeta | null;
  docLabel: string;
  onClose: () => void;
  /** Abre a zona de upload do item (substituir arquivo). */
  onReplace: (docType: string) => void;
  /** Chamado após exclusão confirmada. */
  onDeleted: (message: string) => void;
}

export function DocDetailDrawer({
  doc,
  docLabel,
  onClose,
  onReplace,
  onDeleted,
}: DocDetailDrawerProps) {
  const utils = trpc.useUtils();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [mimeType, setMimeType] = useState<string>("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const remove = trpc.documents.remove.useMutation({
    onSuccess: async () => {
      await utils.documents.checklist.invalidate();
      await utils.documents.list.invalidate();
      onDeleted("Documento excluído definitivamente.");
    },
    onError: (err) => {
      setDeleteError(err.message || "Não foi possível excluir — tente de novo.");
    },
  });

  // Carrega o blob autenticado ao abrir; limpa ao fechar/trocar.
  useEffect(() => {
    setConfirmingDelete(false);
    setDeleteError(null);
    setPreviewError(null);
    setFileName("");
    setMimeType("");
    if (!doc) {
      setObjectUrl(null);
      return;
    }
    let revoked: string | null = null;
    let cancelled = false;
    setLoadingPreview(true);
    utils.documents.download
      .fetch({ documentId: doc.id })
      .then((data) => {
        if (cancelled) return;
        const url = base64ToObjectURL(data.dataBase64, data.mimeType);
        revoked = url;
        setObjectUrl(url);
        setFileName(data.fileName);
        setMimeType(data.mimeType);
      })
      .catch(() => {
        if (!cancelled) setPreviewError("Não foi possível carregar o arquivo — tente de novo.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
      setObjectUrl(null);
    };
    // utils é estável; reexecuta só quando o documento muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]);

  // Foco inicial + focus trap + ESC
  useEffect(() => {
    if (!doc) return;
    const panel = panelRef.current;
    closeBtnRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [doc, onClose]);

  const confirmDelete = () => {
    if (!doc) return;
    remove.mutate({ documentId: doc.id });
  };

  return (
    <AnimatePresence>
      {doc ? (
        <div className="fixed inset-0 z-50" role="presentation">
          <motion.button
            type="button"
            aria-label="Fechar detalhes do documento"
            className="absolute inset-0 h-full w-full cursor-default bg-ink-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes do documento ${docLabel}`}
            className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col overflow-y-auto border-l border-line bg-surface shadow-card-light"
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-line p-5">
              <div className="min-w-0">
                <h2 className="font-display text-h3 text-txt">{docLabel}</h2>
                <p className="mt-1 truncate text-small text-txt-2">{doc.fileName}</p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-btn border-[1.5px] border-line text-txt transition-colors hover:border-accent"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            <div className="flex flex-1 flex-col gap-5 p-5">
              {/* Preview */}
              <div className="overflow-hidden rounded-input border border-line bg-bg-alt">
                {loadingPreview ? (
                  <p role="status" className="flex items-center gap-2 p-6 text-small text-txt-2">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Carregando preview…
                  </p>
                ) : previewError ? (
                  <p role="alert" className="flex items-center gap-2 p-6 text-small font-bold text-danger">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                    {previewError}
                  </p>
                ) : objectUrl && mimeType.startsWith("image/") ? (
                  <img
                    src={objectUrl}
                    alt={`${docLabel} — enviado em ${formatDateTime(doc.createdAt)}`}
                    className="max-h-72 w-full object-contain"
                  />
                ) : objectUrl ? (
                  <iframe
                    src={objectUrl}
                    title={`Preview do PDF ${doc.fileName}`}
                    className="h-72 w-full"
                  />
                ) : (
                  <p className="flex items-center gap-2 p-6 text-small text-txt-2">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                    Preview indisponível.
                  </p>
                )}
              </div>

              {/* Metadados + status */}
              <dl className="grid grid-cols-2 gap-3 text-small">
                <div>
                  <dt className="font-bold text-txt-2">Status</dt>
                  <dd className="mt-1">
                    <DocStatusBadge upload={doc} />
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-txt-2">Enviado em</dt>
                  <dd className="mt-1 font-mono text-mono text-txt">
                    {formatDateTime(doc.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-txt-2">Tamanho</dt>
                  <dd className="mt-1 font-mono text-mono text-txt">{formatBytes(doc.sizeBytes)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-txt-2">Versão</dt>
                  <dd className="mt-1 font-mono text-mono text-txt">v{doc.version}</dd>
                </div>
              </dl>

              {/* Histórico de versões */}
              <div className="rounded-input border border-line bg-bg-alt/50 p-4">
                <h3 className="text-small font-bold text-txt">Histórico de versões</h3>
                <p className="mt-1 text-small text-txt-2">
                  {doc.version > 1
                    ? `Este é o envio nº ${doc.version}. Cada reenvio substitui o arquivo anterior e volta para a fila de revisão.`
                    : "Primeiro envio deste documento. Reenvios aparecem aqui como novas versões."}
                </p>
              </div>

              {/* Comentário da revisão */}
              {doc.status === "rejected" && doc.rejectionReason ? (
                <div className="rounded-input border-[1.5px] border-danger/50 bg-danger/5 p-4">
                  <h3 className="flex items-center gap-1.5 text-small font-bold text-danger">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    Comentário da revisão
                  </h3>
                  <p className="mt-1 text-small text-txt">{doc.rejectionReason}</p>
                </div>
              ) : null}

              {deleteError ? (
                <p role="alert" className="flex items-center gap-1.5 text-small font-bold text-danger">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  {deleteError}
                </p>
              ) : null}

              {/* Ações */}
              <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4">
                <div className="flex flex-wrap gap-2">
                  {objectUrl ? (
                    <a
                      href={objectUrl}
                      download={fileName || doc.fileName}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border-[1.5px] border-line bg-surface px-4 text-small font-bold text-txt transition-colors hover:border-accent"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Baixar
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      onReplace(doc.docType);
                      onClose();
                    }}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border-[1.5px] border-line bg-surface px-4 text-small font-bold text-txt transition-colors hover:border-accent"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Substituir arquivo
                  </button>
                </div>

                {confirmingDelete ? (
                  <div className="rounded-input border-[1.5px] border-danger/50 bg-danger/5 p-4">
                    <p className="text-small font-bold text-txt">
                      Excluir definitivamente? Esta ação não pode ser desfeita.
                    </p>
                    <p className="mt-1 text-small text-txt-2">
                      Pelo seu direito de eliminação (LGPD), removemos o arquivo dos nossos
                      servidores.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={confirmDelete}
                        disabled={remove.isPending}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-danger px-4 text-small font-bold text-white transition-opacity disabled:opacity-60"
                      >
                        {remove.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                        Sim, excluir
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(false)}
                        className="inline-flex min-h-[44px] items-center rounded-btn border-[1.5px] border-line bg-surface px-4 text-small font-bold text-txt"
                      >
                        Manter arquivo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-btn px-2 text-small font-bold text-danger underline underline-offset-4"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Excluir documento
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

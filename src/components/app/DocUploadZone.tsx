import { useRef, useState } from "react";
import { Camera, FileText, Loader2, Upload, X } from "lucide-react";
import { DOC_ACCEPTED_MIME, DOC_MAX_BYTES } from "@contracts/constants";
import { cn } from "@/lib/utils";
import { fileToBase64, formatBytes } from "./masks";

/**
 * Dropzone acessível (design app-documentos.md DO3):
 * área tracejada + botão real (arrastar é bônus, nunca o único caminho),
 * segundo input com capture="environment" para "Tirar foto agora" no mobile.
 * Validação client-side: ≤ 5 MB, PDF/JPG/PNG, com erros descritivos.
 */

export interface UploadPayload {
  fileName: string;
  mimeType: (typeof DOC_ACCEPTED_MIME)[number];
  dataBase64: string;
}

interface DocUploadZoneProps {
  docType: string;
  docLabel: string;
  /** Envia o arquivo; deve lançar erro em caso de falha. */
  onUpload: (docType: string, payload: UploadPayload) => Promise<void>;
  onCancel: () => void;
}

function validateFile(file: File): string | null {
  if (file.size > DOC_MAX_BYTES) {
    return `Arquivo maior que 5 MB — envie PDF ou foto (JPG/PNG) menor. Este tem ${formatBytes(file.size)}.`;
  }
  if (!(DOC_ACCEPTED_MIME as readonly string[]).includes(file.type)) {
    return "Formato não aceito — envie PDF ou foto (JPG/PNG).";
  }
  return null;
}

export function DocUploadZone({ docType, docLabel, onUpload, onCancel }: DocUploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sending, setSending] = useState(false);
  const pickInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const acceptAttr = "application/pdf,image/jpeg,image/png";

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const selectFile = (chosen: File | null | undefined) => {
    if (!chosen) return;
    const problem = validateFile(chosen);
    if (problem) {
      setError(problem);
      setFile(null);
      clearPreview();
      // devolve o foco à mensagem de erro (anunciada via role=alert)
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setError(null);
    setFile(chosen);
    clearPreview();
    if (chosen.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(chosen));
    }
  };

  const send = async () => {
    if (!file || sending) return;
    setSending(true);
    setError(null);
    try {
      const dataBase64 = await fileToBase64(file);
      await onUpload(docType, {
        fileName: file.name,
        mimeType: file.type as UploadPayload["mimeType"],
        dataBase64,
      });
      clearPreview();
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Sem conexão — tente de novo.";
      setError(message);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setSending(false);
    }
  };

  const cancel = () => {
    clearPreview();
    onCancel();
  };

  return (
    <div className="rounded-input border border-line bg-bg-alt/50 p-4">
      {error ? (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-3 flex items-start gap-1.5 rounded-input border-[1.5px] border-danger bg-surface p-3 text-small font-bold text-danger focus:outline-none"
        >
          <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}

      {!file ? (
        <div
          role="group"
          aria-label={`Enviar arquivo para ${docLabel}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            selectFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex flex-col items-center gap-3 rounded-input border-2 border-dashed p-6 text-center transition-colors",
            dragOver ? "border-accent bg-accent/10" : "border-line bg-surface",
          )}
        >
          <Upload className="h-8 w-8 text-accent" aria-hidden="true" />
          <p className="text-small text-txt">
            Arraste o PDF ou a foto aqui, ou{" "}
            <button
              type="button"
              className="min-h-[44px] font-bold text-accent underline underline-offset-4"
              onClick={() => pickInputRef.current?.click()}
            >
              escolha no seu aparelho
            </button>
          </p>
          <p className="text-small text-txt-2">
            Aceita PDF ou foto (JPG/PNG) de até 5 MB.
          </p>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border-[1.5px] border-line bg-surface px-4 text-small font-bold text-txt transition-colors hover:border-accent"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            Tirar foto agora
          </button>
          <input
            ref={pickInputRef}
            type="file"
            accept={acceptAttr}
            className="sr-only"
            aria-label={`Escolher arquivo para ${docLabel}`}
            onChange={(e) => {
              selectFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            aria-label={`Tirar foto agora para ${docLabel}`}
            onChange={(e) => {
              selectFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-input border border-line bg-surface p-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`Prévia de ${docLabel} — arquivo ${file.name}`}
                className="h-16 w-16 shrink-0 rounded-md border border-line object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-line bg-bg-alt">
                <FileText className="h-7 w-7 text-accent" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-small font-bold text-txt">{file.name}</p>
              <p className="text-small text-txt-2">{formatBytes(file.size)}</p>
            </div>
          </div>

          {sending ? (
            <div
              role="status"
              className="flex items-center gap-2 text-small font-bold text-txt"
              aria-live="polite"
            >
              <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden="true" />
              Enviando {file.name} ({formatBytes(file.size)})…
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={sending}
              onClick={send}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-5 text-small font-bold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Enviar
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => {
                setFile(null);
                clearPreview();
                pickInputRef.current?.click();
              }}
              className="inline-flex min-h-[44px] items-center rounded-btn border-[1.5px] border-line bg-surface px-4 text-small font-bold text-txt transition-colors hover:border-accent disabled:opacity-60"
            >
              Trocar
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={cancel}
              className="inline-flex min-h-[44px] items-center rounded-btn px-4 text-small font-bold text-txt-2 underline underline-offset-4 disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

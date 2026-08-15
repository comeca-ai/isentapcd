import { useEffect, useRef, useState } from "react";
import { LayoutList, Loader2, ListTree, AlertTriangle } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { TAX_DOCTYPES } from "@contracts/constants";
import { cn } from "@/lib/utils";
import { DocsChecklist, type DocUploadMeta } from "@/components/app/DocsChecklist";
import { DocDetailDrawer } from "@/components/app/DocDetailDrawer";
import type { UploadPayload } from "@/components/app/DocUploadZone";

/**
 * /app/documentos — checklist por órgão + upload + status de revisão
 * (design app-documentos.md). Modo claro (.app-light); o AppShell final também
 * aplica o escopo — a redundância é segura porque os tokens são por escopo.
 */

const VIEW_KEY = "isentapcd:docs-view";

export default function Documentos() {
  const utils = trpc.useUtils();
  const checklist = trpc.documents.checklist.useQuery(undefined, { retry: 1 });
  const paywall = trpc.stages.triggerPaywall.useMutation();

  const [view, setView] = useState<"org" | "flat">(() =>
    typeof window !== "undefined" && window.localStorage.getItem(VIEW_KEY) === "flat"
      ? "flat"
      : "org",
  );
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ doc: DocUploadMeta; label: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const firstSendBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  // some o toast depois de alguns segundos (a região aria-live já anunciou)
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const upload = trpc.documents.upload.useMutation({
    onSuccess: async (_data, vars) => {
      await utils.documents.checklist.invalidate();
      await utils.documents.list.invalidate();
      setToast("Recebemos! Avisamos quando a revisão terminar (até 1 dia útil).");
      // 1º comprovante de guia paga → reflete o gatilho do paywall (o backend também dispara)
      if ((TAX_DOCTYPES as readonly string[]).includes(vars.docType)) {
        paywall.mutate({ docType: vars.docType });
      }
    },
  });

  const handleUpload = async (docType: string, payload: UploadPayload) => {
    await upload.mutateAsync({ docType, ...payload });
  };

  const groups = checklist.data ?? [];
  const totalDocs = groups.reduce((acc, g) => acc + g.docs.length, 0);
  const sentDocs = groups.reduce((acc, g) => acc + g.docs.filter((d) => d.upload).length, 0);
  const rejectedDocs = groups.reduce(
    (acc, g) => acc + g.docs.filter((d) => d.upload?.status === "rejected").length,
    0,
  );
  const isEmpty = checklist.isSuccess && sentDocs === 0;

  const openDetail = (doc: DocUploadMeta, label: string, trigger: HTMLElement | null) => {
    detailTriggerRef.current = trigger;
    setDetail({ doc, label });
  };

  const closeDetail = () => {
    setDetail(null);
    requestAnimationFrame(() => detailTriggerRef.current?.focus());
  };

  const startFirstUpload = () => {
    const firstPending = groups.flatMap((g) => g.docs).find((d) => !d.upload);
    if (firstPending) {
      setUploadTarget(firstPending.docType);
      requestAnimationFrame(() => {
        document.getElementById(`docs-item-${firstPending.docType}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  };

  return (
    <div className="app-light min-h-[100dvh] bg-bg text-txt">
      <section className="mx-auto max-w-content px-6 py-10 lg:px-10">
        {/* DO1 — Header */}
        <header>
          <h1 className="text-h1 font-medium">Meus documentos</h1>
          <p className="mt-3 max-w-prose68 text-lead text-txt-2">
            Envie aqui; nossa equipe revisa cada arquivo antes de você protocolar no órgão.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Resumo dos documentos">
            <li className="rounded-full border border-line bg-surface px-4 py-1.5 font-mono text-mono text-txt">
              {sentDocs} de {totalDocs} enviados
            </li>
            {rejectedDocs > 0 ? (
              <li className="rounded-full border border-danger/40 bg-danger/10 px-4 py-1.5 font-mono text-mono text-danger">
                {rejectedDocs} para corrigir
              </li>
            ) : null}
            <li className="rounded-full border border-line bg-surface px-4 py-1.5 font-mono text-mono text-txt-2">
              revisão em até 1 dia útil
            </li>
          </ul>

          {/* Toggle de visualização */}
          <div
            role="group"
            aria-label="Modo de visualização"
            className="mt-6 inline-flex rounded-btn border border-line bg-surface p-1"
          >
            {(
              [
                { key: "org", label: "Por órgão", Icon: ListTree },
                { key: "flat", label: "Lista única", Icon: LayoutList },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={cn(
                  "inline-flex min-h-[44px] items-center gap-2 rounded-btn px-4 text-small font-bold transition-colors",
                  view === key ? "bg-accent text-on-accent" : "text-txt-2 hover:text-txt",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* Toast / anúncios */}
        <div aria-live="polite" role="status" className="mt-4">
          {toast ? (
            <p className="inline-flex items-center gap-2 rounded-input border border-success/40 bg-success/10 px-4 py-2 text-small font-bold text-success">
              {toast}
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          {checklist.isLoading ? (
            <div role="status" className="flex items-center gap-2 text-small text-txt-2">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Carregando seu checklist…
            </div>
          ) : checklist.isError ? (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-input border-[1.5px] border-danger bg-surface p-4"
            >
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
              <p className="text-small font-bold text-txt">
                Não foi possível carregar seus documentos.
              </p>
              <button
                type="button"
                onClick={() => checklist.refetch()}
                className="min-h-[44px] rounded-btn border-[1.5px] border-line px-4 text-small font-bold text-txt hover:border-accent"
              >
                Tentar de novo
              </button>
            </div>
          ) : (
            <>
              {/* DO4 — Estado vazio */}
              {isEmpty ? (
                <div className="mb-6 flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-8 text-center">
                  <img src="/empty-docs.svg" alt="" className="h-40 w-auto" />
                  <div>
                    <h2 className="font-display text-h3 text-txt">
                      Nenhum documento enviado ainda
                    </h2>
                    <p className="mt-2 text-body text-txt-2">
                      Comece pelo laudo médico — ele é a peça-chave do seu processo.
                    </p>
                  </div>
                  <button
                    ref={firstSendBtnRef}
                    type="button"
                    onClick={startFirstUpload}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-5 text-small font-bold text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    Enviar primeiro documento
                  </button>
                </div>
              ) : null}

              <DocsChecklist
                groups={groups}
                view={view}
                uploadTarget={uploadTarget}
                onOpenUpload={(docType) => setUploadTarget(docType)}
                onCloseUpload={() => setUploadTarget(null)}
                onUpload={handleUpload}
                onOpenDetail={(doc, label) => {
                  const trigger = document.activeElement as HTMLElement | null;
                  openDetail(doc, label, trigger);
                }}
              />
            </>
          )}
        </div>
      </section>

      {/* DO5 — Drawer de detalhe */}
      <DocDetailDrawer
        doc={detail?.doc ?? null}
        docLabel={detail?.label ?? ""}
        onClose={closeDetail}
        onReplace={(docType) => setUploadTarget(docType)}
        onDeleted={(message) => {
          setToast(message);
          closeDetail();
        }}
      />
    </div>
  );
}

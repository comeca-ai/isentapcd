import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  Mail,
  PartyPopper,
  Route,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { DOC_TRAIL_INSTRUCTIONS, DOC_TRAIL_ORDER, TAX_DOCTYPES } from "@contracts/constants";
import { DocsTrail } from "@/components/app/DocsTrail";
import { DocDetailDrawer } from "@/components/app/DocDetailDrawer";
import type { DocUploadMeta } from "@/components/app/DocsChecklist";
import type { UploadPayload } from "@/components/app/DocUploadZone";

/**
 * /app/documentos — TRILHA GUIADA de envio de documentos (POC v3):
 * sequência numerada única (DOC_TRAIL), card "Seu próximo passo", progresso
 * "X de N", status por etapa (upload + revisão humana + OCR automático).
 * Reaproveita DocUploadZone (base64 ≤5MB + capture mobile) e DocDetailDrawer.
 */
export default function Documentos() {
  const utils = trpc.useUtils();
  const checklist = trpc.documents.checklist.useQuery(undefined, {
    retry: 1,
    // Enquanto houver OCR em andamento, atualiza a cada 3s (spinner "Analisando…").
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const processing = data.some((g) =>
        g.docs.some((d) => d.upload?.ocrStatus === "processing"),
      );
      return processing ? 3000 : false;
    },
  });
  const paywall = trpc.stages.triggerPaywall.useMutation();

  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ doc: DocUploadMeta; label: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<number | null>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);

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
      setToast("Recebemos! Você vai receber um e-mail e a análise automática já começou.");
      // 1º comprovante de guia paga → reflete o gatilho do paywall (o backend também dispara)
      if ((TAX_DOCTYPES as readonly string[]).includes(vars.docType)) {
        paywall.mutate({ docType: vars.docType });
      }
    },
  });

  const reprocess = trpc.documents.reprocessOcr.useMutation({
    onSuccess: async () => {
      await utils.documents.checklist.invalidate();
      setToast("Nova análise automática em andamento — já já atualiza aqui.");
    },
    onSettled: () => setReprocessingId(null),
  });

  const handleUpload = async (docType: string, payload: UploadPayload) => {
    await upload.mutateAsync({ docType, ...payload });
  };

  const handleReprocess = (doc: DocUploadMeta) => {
    setReprocessingId(doc.id);
    reprocess.mutate({ documentId: doc.id });
  };

  const groups = checklist.data ?? [];
  const byType = new Map(groups.flatMap((g) => g.docs.map((d) => [d.docType, d] as const)));
  const trailDocs = DOC_TRAIL_ORDER.map((dt) => byType.get(dt)).filter(
    (d): d is NonNullable<typeof d> => Boolean(d),
  );
  const totalDocs = trailDocs.length;
  const sentDocs = trailDocs.filter((d) => d.upload).length;
  const attentionDocs = trailDocs.filter(
    (d) => d.upload && d.upload.status !== "approved" && d.upload.ocrStatus === "attention",
  ).length;
  const rejectedDocs = trailDocs.filter((d) => d.upload?.status === "rejected").length;
  const nextStep = trailDocs.find((d) => !d.upload || d.upload.status === "rejected") ?? null;
  const allSent = checklist.isSuccess && totalDocs > 0 && sentDocs === totalDocs;
  const pct = totalDocs > 0 ? Math.round((sentDocs / totalDocs) * 100) : 0;

  const openDetail = (doc: DocUploadMeta, label: string, trigger: HTMLElement | null) => {
    detailTriggerRef.current = trigger;
    setDetail({ doc, label });
  };

  const closeDetail = () => {
    setDetail(null);
    requestAnimationFrame(() => detailTriggerRef.current?.focus());
  };

  const goToStep = (docType: string) => {
    setUploadTarget(docType);
    requestAnimationFrame(() => {
      document.getElementById(`docs-item-${docType}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  return (
    <div className="app-light min-h-[100dvh] bg-bg text-txt">
      <section className="mx-auto max-w-content px-6 py-10 lg:px-10">
        {/* Header */}
        <header>
          <h1 className="text-h1 font-medium">Trilha de documentos</h1>
          <p className="mt-3 max-w-prose68 text-lead text-txt-2">
            Um passo de cada vez, na ordem certa do processo. A gente lê cada arquivo
            automaticamente e avisa por e-mail se estiver tudo certo ou se algo precisa de ajuste.
          </p>

          {/* Progresso geral */}
          <div className="mt-5" aria-label={`Progresso: ${sentDocs} de ${totalDocs} documentos enviados`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-line bg-surface px-4 py-1.5 font-mono text-mono text-txt">
                {sentDocs} de {totalDocs} documentos
              </span>
              {attentionDocs > 0 ? (
                <span className="rounded-full border border-coral-600/40 bg-coral-400/10 px-4 py-1.5 font-mono text-mono text-coral-600">
                  {attentionDocs} com atenção
                </span>
              ) : null}
              {rejectedDocs > 0 ? (
                <span className="rounded-full border border-danger/40 bg-danger/10 px-4 py-1.5 font-mono text-mono text-danger">
                  {rejectedDocs} para corrigir
                </span>
              ) : null}
            </div>
            <div className="mt-3 h-2 max-w-md overflow-hidden rounded-full bg-bg-alt" aria-hidden="true">
              <div
                className="h-full rounded-full bg-success transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-3 flex items-center gap-2 text-small text-txt-2">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              A cada envio, você recebe um e-mail com o resultado da análise.
            </p>
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
              Carregando sua trilha…
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
              {/* Seu próximo passo */}
              {nextStep ? (
                <section
                  aria-labelledby="proximo-passo"
                  className="mb-6 rounded-card border border-accent bg-surface p-6 shadow-card-light"
                >
                  <p className="flex items-center gap-2 font-mono text-mono font-medium uppercase tracking-wider text-accent">
                    <Route className="h-4 w-4" aria-hidden="true" />
                    Seu próximo passo
                  </p>
                  <h2 id="proximo-passo" className="mt-2 font-display text-h3 text-txt">
                    {nextStep.label}
                  </h2>
                  <p className="mt-2 max-w-prose68 text-body text-txt-2">
                    {DOC_TRAIL_INSTRUCTIONS[nextStep.docType] ?? nextStep.hint}
                  </p>
                  <button
                    type="button"
                    onClick={() => goToStep(nextStep.docType)}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-5 text-small font-bold text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    Enviar agora
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </section>
              ) : allSent ? (
                <section
                  aria-label="Trilha completa"
                  className="mb-6 flex flex-col items-center gap-3 rounded-card border border-success/40 bg-success/10 p-8 text-center"
                >
                  <PartyPopper className="h-8 w-8 text-success" aria-hidden="true" />
                  <h2 className="font-display text-h3 text-txt">Trilha completa!</h2>
                  <p className="max-w-prose68 text-body text-txt-2">
                    Você enviou todos os {totalDocs} documentos. O time revisa cada um e avisa por
                    e-mail.
                  </p>
                </section>
              ) : null}

              <DocsTrail
                groups={groups}
                uploadTarget={uploadTarget}
                onOpenUpload={(docType) => setUploadTarget(docType)}
                onCloseUpload={() => setUploadTarget(null)}
                onUpload={handleUpload}
                onOpenDetail={(doc, label) => {
                  const trigger = document.activeElement as HTMLElement | null;
                  openDetail(doc, label, trigger);
                }}
                onReprocess={handleReprocess}
                reprocessingId={reprocessingId}
              />
            </>
          )}
        </div>
      </section>

      {/* Drawer de detalhe */}
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

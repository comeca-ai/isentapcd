import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { inferRouterOutputs } from '@trpc/server'
import { Link } from 'react-router'
import { Check, FileText, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { DOC_TYPE_MAP } from '@contracts/constants'
import type { AppRouter } from '../../../api/router'
import { cn } from '@/lib/utils'

type RouterOutputs = inferRouterOutputs<AppRouter>
type QueueItem = RouterOutputs['admin']['reviewQueue'][number]

const DATE_FMT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const MOTIVOS_COMUNS = [
  'A foto ficou ilegível. Tire outra em lugar claro, sem cortar as bordas, e envie de novo.',
  'Este documento está vencido. Envie uma versão mais recente.',
  'Faltou o carimbo e a assinatura do médico (com CRM). Peça a correção e reenvie.',
  'O arquivo veio cortado — parte do documento não aparece. Envie a página inteira.',
  'O nome no documento está diferente do cadastro. Confira e reenvie o documento certo.',
]

function tempoEspera(createdAt: string | Date): { texto: string; nivel: 'ok' | 'atencao' | 'critico' } {
  const horas = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
  const nivel = horas > 40 ? 'critico' : horas > 20 ? 'atencao' : 'ok'
  const texto = horas >= 24 ? `há ${Math.floor(horas / 24)} d` : `há ${Math.max(1, Math.floor(horas))} h`
  return { texto, nivel }
}

function tamanhoHumano(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function base64ToBlobUrl(base64: string, mime: string): string {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: mime }))
}

/** Requisitos exibidos no checklist: hint oficial do tipo + checagens gerais. */
function requisitosDo(docType: string): string[] {
  const def = DOC_TYPE_MAP[docType]
  const base = [
    'Arquivo abre e está legível',
    'Nome do titular confere com o cadastro',
    'Documento dentro da validade',
  ]
  return def ? [`Regra do documento: ${def.hint}`, ...base] : base
}

function lendoChecklist(docType: string): boolean[] {
  try {
    return JSON.parse(localStorage.getItem(`revisao-checklist:${docType}`) ?? '[]') as boolean[]
  } catch {
    return []
  }
}

function useChecklist(docType: string | null) {
  const [estado, setEstado] = useState<{ chave: string | null; marcados: boolean[] }>({
    chave: null,
    marcados: [],
  })
  // Ajuste durante a renderização ao trocar de tipo de documento (sem efeito)
  if (estado.chave !== docType) {
    setEstado({ chave: docType, marcados: docType ? lendoChecklist(docType) : [] })
  }
  const alternar = (idx: number, total: number) => {
    setEstado((atual) => {
      const prox = Array.from({ length: total }, (_, i) =>
        i === idx ? !atual.marcados[i] : Boolean(atual.marcados[i]),
      )
      if (docType) localStorage.setItem(`revisao-checklist:${docType}`, JSON.stringify(prox))
      return { chave: docType, marcados: prox }
    })
  }
  return { marcados: estado.chave === docType ? estado.marcados : [], alternar }
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export default function AdminRevisao() {
  const utils = trpc.useUtils()
  const fila = trpc.admin.reviewQueue.useQuery()
  const review = trpc.admin.reviewDocument.useMutation()

  const [selecionadoId, setSelecionadoId] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotacao, setRotacao] = useState(0)
  const [rejeitando, setRejeitando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [flash, setFlash] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const motivoRef = useRef<HTMLTextAreaElement>(null)
  const listaRef = useRef<HTMLUListElement>(null)

  const itens = useMemo(() => fila.data ?? [], [fila.data])
  const selecionado: QueueItem | null =
    itens.find((d) => d.id === selecionadoId) ?? itens[0] ?? null

  const doc = trpc.admin.getDocument.useQuery(
    { documentId: selecionado?.id ?? 0 },
    { enabled: selecionado !== null },
  )

  // objectURL derivado do blob; revogado ao trocar de documento (efeito = sistema externo)
  const docUrl = useMemo(
    () => (doc.data ? base64ToBlobUrl(doc.data.dataBase64, doc.data.mimeType) : null),
    [doc.data],
  )
  useEffect(() => {
    return () => {
      if (docUrl) URL.revokeObjectURL(docUrl)
    }
  }, [docUrl])

  // Reseta controles ao trocar de documento (ajuste durante a renderização)
  const [docAnterior, setDocAnterior] = useState(selecionado?.id ?? null)
  if ((selecionado?.id ?? null) !== docAnterior) {
    setDocAnterior(selecionado?.id ?? null)
    setZoom(1)
    setRotacao(0)
    setRejeitando(false)
    setMotivo('')
  }

  const requisitos = useMemo(
    () => (selecionado ? requisitosDo(selecionado.docType) : []),
    [selecionado],
  )
  const { marcados, alternar } = useChecklist(selecionado?.docType ?? null)

  const moverSelecao = useCallback(
    (delta: number) => {
      if (itens.length === 0 || !selecionado) return
      const idx = itens.findIndex((d) => d.id === selecionado.id)
      const prox = Math.min(itens.length - 1, Math.max(0, idx + delta))
      setSelecionadoId(itens[prox].id)
      listaRef.current
        ?.querySelector(`[data-doc-id="${itens[prox].id}"]`)
        ?.scrollIntoView({ block: 'nearest' })
    },
    [itens, selecionado],
  )

  async function decidir(decision: 'approve' | 'reject') {
    if (!selecionado || review.isPending) return
    if (decision === 'reject' && motivo.trim().length === 0) {
      setRejeitando(true)
      motivoRef.current?.focus()
      setFlash({ tipo: 'erro', texto: 'Informe o motivo da rejeição — é o texto que o cliente vai ler.' })
      return
    }
    const nome = selecionado.userName
    try {
      await review.mutateAsync({
        documentId: selecionado.id,
        decision,
        ...(decision === 'reject' ? { rejectionReason: motivo.trim() } : {}),
      })
      await utils.admin.reviewQueue.invalidate()
      const restantes = itens.filter((d) => d.id !== selecionado.id)
      setSelecionadoId(restantes[0]?.id ?? null)
      setFlash({
        tipo: 'ok',
        texto:
          decision === 'approve'
            ? `Documento de ${nome} aprovado. ${restantes.length} restantes na fila.`
            : `Documento de ${nome} rejeitado — o cliente recebe o motivo por e-mail. ${restantes.length} restantes.`,
      })
    } catch (e) {
      setFlash({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro inesperado.' })
    }
  }

  // Atalhos de teclado (admin.md A4): ↑/↓ navega, A aprova, R abre rejeição
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        moverSelecao(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moverSelecao(-1)
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault()
        void decidir('approve')
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault()
        setRejeitando(true)
        requestAnimationFrame(() => motivoRef.current?.focus())
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const espera = selecionado ? tempoEspera(selecionado.createdAt) : null
  const isPdf = doc.data?.mimeType === 'application/pdf'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 font-medium">Revisão de documentos</h1>
          <p className="mt-1 text-small text-txt-2">
            {itens.length} {itens.length === 1 ? 'documento na fila' : 'documentos na fila'} · SLA:
            1 dia útil
          </p>
        </div>
        <p className="rounded-input border border-line bg-surface px-3 py-2 text-small text-txt-2">
          Atalhos: <kbd className="rounded border border-line bg-bg-alt px-1.5 font-mono">↑</kbd>{' '}
          <kbd className="rounded border border-line bg-bg-alt px-1.5 font-mono">↓</kbd> navegar ·{' '}
          <kbd className="rounded border border-line bg-bg-alt px-1.5 font-mono">A</kbd> aprovar ·{' '}
          <kbd className="rounded border border-line bg-bg-alt px-1.5 font-mono">R</kbd> rejeitar
        </p>
      </div>

      <div role="status" aria-live="polite" className="min-h-6">
        {flash && (
          <p
            className={cn(
              'rounded-input border px-4 py-2 text-small font-bold',
              flash.tipo === 'erro'
                ? 'border-danger bg-coral-400/10 text-danger'
                : 'border-success bg-moss-400/10 text-success',
            )}
          >
            {flash.texto}
          </p>
        )}
      </div>

      {fila.isLoading && <p role="status" className="text-lead text-txt-2">Carregando fila…</p>}
      {fila.error && (
        <p role="alert" className="rounded-card border border-danger bg-surface p-4 font-bold text-danger">
          Erro ao carregar a fila: {fila.error.message}
        </p>
      )}
      {!fila.isLoading && !fila.error && itens.length === 0 && (
        <div className="rounded-card border border-line bg-surface p-10 text-center shadow-card-light">
          <Check className="mx-auto size-10 text-success" aria-hidden="true" />
          <p className="mt-3 text-h3 font-semibold">Fila zerada</p>
          <p className="mt-1 text-small text-txt-2">Nenhum documento aguardando revisão agora.</p>
        </div>
      )}

      {selecionado && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          {/* Fila */}
          <section aria-label="Fila de documentos" className="rounded-card border border-line bg-surface shadow-card-light">
            <h2 className="border-b border-line px-4 py-3 text-small font-bold">
              Fila ({itens.length})
            </h2>
            <ul ref={listaRef} className="max-h-[70dvh] overflow-y-auto p-2" aria-label="Documentos aguardando revisão">
              {itens.map((item) => {
                const esp = tempoEspera(item.createdAt)
                const ativo = item.id === selecionado.id
                return (
                  <li key={item.id} data-doc-id={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelecionadoId(item.id)}
                      aria-current={ativo}
                      className={cn(
                        'flex w-full min-h-[56px] items-start gap-3 rounded-input px-3 py-2.5 text-left',
                        ativo ? 'bg-bg-alt ring-1 ring-accent' : 'hover:bg-bg-alt/60',
                      )}
                    >
                      <FileText className="mt-0.5 size-5 shrink-0 text-txt-2" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-small font-bold">{item.userName}</span>
                        <span className="block truncate text-[13px] text-txt-2">{item.label}</span>
                        <span
                          className={cn(
                            'tnum mt-0.5 inline-block font-mono text-mono',
                            esp.nivel === 'ok' && 'text-txt-2',
                            esp.nivel === 'atencao' && 'font-semibold text-warn',
                            esp.nivel === 'critico' && 'font-semibold text-danger',
                          )}
                        >
                          {esp.texto}
                          {item.version > 1 ? ` · v${item.version} (reenvio)` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Preview */}
          <section aria-label="Pré-visualização do documento" className="flex flex-col rounded-card border border-line bg-surface shadow-card-light">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 text-[13px] text-txt-2">
              <span className="font-bold text-txt">{doc.data?.fileName ?? selecionado.fileName}</span>
              <span>enviado em {DATE_FMT.format(new Date(selecionado.createdAt))}</span>
              <span>{tamanhoHumano(selecionado.sizeBytes)}</span>
              <span className="uppercase">{selecionado.mimeType.split('/')[1]}</span>
              {selecionado.version > 1 && <span>versão {selecionado.version} (reenvio)</span>}
              {!isPdf && docUrl && (
                <span className="ml-auto flex items-center gap-1" role="group" aria-label="Controles de imagem">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                    aria-label="Reduzir zoom"
                    className="flex size-10 items-center justify-center rounded-btn border border-line hover:bg-bg-alt"
                  >
                    <ZoomOut className="size-4" aria-hidden="true" />
                  </button>
                  <span className="tnum w-12 text-center font-mono text-mono" aria-live="polite">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                    aria-label="Aumentar zoom"
                    className="flex size-10 items-center justify-center rounded-btn border border-line hover:bg-bg-alt"
                  >
                    <ZoomIn className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotacao((r) => (r + 90) % 360)}
                    aria-label="Girar 90 graus"
                    className="flex size-10 items-center justify-center rounded-btn border border-line hover:bg-bg-alt"
                  >
                    <RotateCw className="size-4" aria-hidden="true" />
                  </button>
                </span>
              )}
            </div>
            <div className="flex min-h-[420px] flex-1 items-center justify-center overflow-auto bg-bg-alt/60 p-4">
              {doc.isLoading && <p role="status" className="text-small text-txt-2">Carregando arquivo…</p>}
              {doc.error && (
                <p role="alert" className="text-small font-bold text-danger">
                  Não foi possível abrir o arquivo: {doc.error.message}
                </p>
              )}
              {docUrl && isPdf && (
                <iframe
                  title={`Documento ${doc.data?.fileName ?? ''}`}
                  src={docUrl}
                  className="h-[70dvh] w-full rounded-input border border-line bg-white"
                />
              )}
              {docUrl && !isPdf && (
                <img
                  src={docUrl}
                  alt={`Documento enviado: ${doc.data?.fileName ?? selecionado.fileName}`}
                  style={{ transform: `scale(${zoom}) rotate(${rotacao}deg)` }}
                  className="max-h-[70dvh] max-w-full object-contain"
                />
              )}
            </div>
          </section>

          {/* Painel de decisão */}
          <section aria-label="Decisão" className="flex flex-col rounded-card border border-line bg-surface shadow-card-light">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-small font-bold">{selecionado.userName}</h2>
              <p className="mt-0.5 text-[13px] text-txt-2">
                {selecionado.userEmail} · {selecionado.uf ?? 'UF —'} ·{' '}
                <Link to="/admin/processos" className="underline underline-offset-4">
                  ver processo
                </Link>
              </p>
              {espera && (
                <p
                  className={cn(
                    'tnum mt-1 font-mono text-mono',
                    espera.nivel === 'ok' && 'text-txt-2',
                    espera.nivel === 'atencao' && 'font-semibold text-warn',
                    espera.nivel === 'critico' && 'font-semibold text-danger',
                  )}
                >
                  Aguardando {espera.texto}
                  {espera.nivel !== 'ok' ? ' — fora do SLA de 1 dia útil' : ''}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <h3 className="text-small font-bold">{selecionado.label}</h3>
              <fieldset className="mt-2">
                <legend className="text-[13px] text-txt-2">
                  Checklist de requisitos (marque o que conferiu)
                </legend>
                <ul className="mt-2 space-y-2">
                  {requisitos.map((req, i) => (
                    <li key={req}>
                      <label className="flex min-h-[40px] cursor-pointer items-start gap-3 rounded-input border border-line px-3 py-2 text-small hover:bg-bg-alt/60">
                        <input
                          type="checkbox"
                          checked={Boolean(marcados[i])}
                          onChange={() => alternar(i, requisitos.length)}
                          className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
                        />
                        <span>{req}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            </div>

            <div className="space-y-3 border-t border-line px-4 py-4">
              <button
                type="button"
                onClick={() => void decidir('approve')}
                disabled={review.isPending}
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-btn bg-success px-4 text-body font-bold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                <Check className="size-5" aria-hidden="true" />
                Aprovar <kbd className="rounded border border-white/40 px-1.5 font-mono text-mono">A</kbd>
              </button>

              {rejeitando ? (
                <div className="space-y-3 rounded-input border border-danger p-3">
                  <label htmlFor="motivo" className="block text-small font-bold text-danger">
                    Motivo da rejeição (obrigatório) — o cliente vai ler este texto
                  </label>
                  <textarea
                    id="motivo"
                    ref={motivoRef}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={3}
                    required
                    aria-required="true"
                    className="w-full rounded-input border border-line bg-surface px-3 py-2 text-small"
                    placeholder="Explique em linguagem simples o que precisa ser corrigido…"
                  />
                  <div className="flex flex-wrap gap-2" aria-label="Motivos frequentes">
                    {MOTIVOS_COMUNS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMotivo(m)}
                        className="min-h-[40px] rounded-full border border-line bg-bg-alt px-3 py-1 text-[13px] hover:border-accent"
                      >
                        {m.split('.')[0].split('—')[0]}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void decidir('reject')}
                      disabled={review.isPending || motivo.trim().length === 0}
                      className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-btn bg-danger px-4 font-bold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      <X className="size-5" aria-hidden="true" />
                      Confirmar rejeição
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejeitando(false)}
                      className="min-h-[52px] rounded-btn border border-line px-4 font-bold hover:bg-bg-alt"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setRejeitando(true)
                    requestAnimationFrame(() => motivoRef.current?.focus())
                  }}
                  disabled={review.isPending}
                  className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-btn border-2 border-danger px-4 text-body font-bold text-danger hover:bg-coral-400/10 disabled:opacity-60"
                >
                  <X className="size-5" aria-hidden="true" />
                  Rejeitar <kbd className="rounded border border-danger/50 px-1.5 font-mono text-mono">R</kbd>
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

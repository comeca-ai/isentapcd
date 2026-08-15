import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import type { inferRouterOutputs } from '@trpc/server'
import { AlertTriangle, CheckCircle2, Clock, GripVertical } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { PRICE_EXECUTION, STAGES, STAGE_MAP, UF_LIST, type StageKey } from '@contracts/constants'
import type { AppRouter } from '../../../api/router'
import { cn } from '@/lib/utils'

type RouterOutputs = inferRouterOutputs<AppRouter>
type ProcessCard = RouterOutputs['admin']['processes']['columns'][number]['cards'][number]

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function diasDesde(iso: string | Date): number {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

function SlaChip({ createdAt }: { createdAt: string | Date }) {
  const dias = diasDesde(createdAt)
  const nivel = dias > 30 ? 'parado' : dias > 15 ? 'atencao' : 'ok'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[13px] font-bold',
        nivel === 'ok' && 'border-line bg-bg-alt text-txt-2',
        nivel === 'atencao' && 'border-warn bg-amber-400/10 text-warn',
        nivel === 'parado' && 'border-danger bg-coral-400/10 text-danger',
      )}
      title={`${dias} dias desde o início do processo`}
    >
      {nivel === 'parado' ? (
        <AlertTriangle className="size-3.5" aria-hidden="true" />
      ) : (
        <Clock className="size-3.5" aria-hidden="true" />
      )}
      {dias} d{nivel === 'atencao' ? ' · atenção' : nivel === 'parado' ? ' · parado' : ''}
      <span className="sr-only"> (dias desde o início do processo)</span>
    </span>
  )
}

function PagamentoBadge({ paidAt }: { paidAt: string | Date | null }) {
  if (paidAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-success bg-moss-400/10 px-2 py-0.5 text-[13px] font-bold text-success">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Pago
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-warn bg-amber-400/10 px-2 py-0.5 text-[13px] font-bold text-warn">
      <Clock className="size-3.5" aria-hidden="true" />
      Pagamento pendente
    </span>
  )
}

interface ConfirmMove {
  card: ProcessCard
  toStage: StageKey
}

export default function AdminProcessos() {
  const utils = trpc.useUtils()
  const processes = trpc.admin.processes.useQuery()
  const updateStage = trpc.admin.updateProcessStage.useMutation()

  const [ufFiltro, setUfFiltro] = useState('')
  const [dragOver, setDragOver] = useState<StageKey | null>(null)
  const [confirmBack, setConfirmBack] = useState<ConfirmMove | null>(null)
  const [movendoId, setMovendoId] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ tipo: 'erro' | 'ok'; texto: string } | null>(null)

  const colunas = useMemo(() => {
    const cols = processes.data?.columns ?? []
    if (!ufFiltro) return cols
    return cols.map((c) => ({ ...c, cards: c.cards.filter((card) => card.uf === ufFiltro) }))
  }, [processes.data, ufFiltro])

  async function executarMovimento(card: ProcessCard, toStage: StageKey) {
    const fromStage = card.currentStage as StageKey
    if (fromStage === toStage) return
    const alvo = STAGE_MAP[toStage]
    setMovendoId(card.id)
    setMsg(null)
    try {
      if (alvo.order > STAGE_MAP[fromStage].order) {
        // Avançar: conclui as etapas entre a atual e o destino, depois ativa o destino.
        for (const s of STAGES) {
          if (s.order >= STAGE_MAP[fromStage].order && s.order < alvo.order) {
            await updateStage.mutateAsync({ processId: card.id, stageKey: s.key, status: 'done' })
          }
        }
        await updateStage.mutateAsync({ processId: card.id, stageKey: toStage, status: 'in_progress' })
      } else {
        // Voltar: devolve as etapas posteriores para pendente e reabre o destino.
        for (const s of STAGES) {
          if (s.order > alvo.order) {
            await updateStage.mutateAsync({ processId: card.id, stageKey: s.key, status: 'pending' })
          }
        }
        await updateStage.mutateAsync({ processId: card.id, stageKey: toStage, status: 'in_progress' })
      }
      await utils.admin.processes.invalidate()
      setMsg({ tipo: 'ok', texto: `${card.name} movido para “${alvo.title}”.` })
    } catch (e) {
      const detalhe = e instanceof Error ? e.message : 'Erro inesperado.'
      setMsg({
        tipo: 'erro',
        texto: `Não foi possível mover ${card.name} para “${alvo.title}”. ${detalhe}`,
      })
      await utils.admin.processes.invalidate()
    } finally {
      setMovendoId(null)
      setConfirmBack(null)
    }
  }

  function pedirMovimento(card: ProcessCard, toStage: StageKey) {
    const fromStage = card.currentStage as StageKey
    if (fromStage === toStage) return
    if (STAGE_MAP[toStage].order < STAGE_MAP[fromStage].order) {
      // Mover para trás exige confirmação (admin.md A3)
      setConfirmBack({ card, toStage })
    } else {
      void executarMovimento(card, toStage)
    }
  }

  function onDropColumn(e: DragEvent, stageKey: StageKey) {
    e.preventDefault()
    setDragOver(null)
    const id = Number(e.dataTransfer.getData('text/process-id'))
    if (!id) return
    const card = (processes.data?.columns ?? [])
      .flatMap((c) => c.cards)
      .find((c) => c.id === id)
    if (card) pedirMovimento(card, stageKey)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 font-medium">Processos</h1>
          <p className="mt-1 text-small text-txt-2">
            {processes.data?.total ?? 0} processos ativos · arraste os cartões ou use “Mover para”
            em cada cartão.
          </p>
        </div>
        <div>
          <label htmlFor="kanban-uf" className="block text-small font-bold">
            Filtrar por UF
          </label>
          <select
            id="kanban-uf"
            value={ufFiltro}
            onChange={(e) => setUfFiltro(e.target.value)}
            className="mt-1 min-h-[44px] rounded-input border border-line bg-surface px-3 text-small"
          >
            <option value="">Todas</option>
            {UF_LIST.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div role="status" aria-live="polite" className="min-h-6">
        {msg && (
          <p
            className={cn(
              'rounded-input border px-4 py-2 text-small font-bold',
              msg.tipo === 'erro' ? 'border-danger bg-coral-400/10 text-danger' : 'border-success bg-moss-400/10 text-success',
            )}
          >
            {msg.texto}
          </p>
        )}
      </div>

      {processes.isLoading && <p role="status" className="text-lead text-txt-2">Carregando kanban…</p>}
      {processes.error && (
        <p role="alert" className="rounded-card border border-danger bg-surface p-4 font-bold text-danger">
          Erro ao carregar processos: {processes.error.message}
        </p>
      )}

      {processes.data && (
        <div className="flex gap-4 overflow-x-auto pb-4" role="list" aria-label="Quadro kanban por etapa">
          {colunas.map((col) => {
            const stageKey = col.stageKey as StageKey
            const pendentesPagamento = col.cards.filter((c) => !c.paidAt).length
            return (
              <section
                key={col.stageKey}
                role="listitem"
                aria-label={`Etapa ${col.title}, ${col.cards.length} processos`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(stageKey)
                }}
                onDragLeave={() => setDragOver((v) => (v === stageKey ? null : v))}
                onDrop={(e) => onDropColumn(e, stageKey)}
                className={cn(
                  'flex w-72 shrink-0 flex-col rounded-card border bg-bg-alt/50',
                  dragOver === stageKey ? 'border-accent ring-2 ring-accent' : 'border-line',
                )}
              >
                <header className="border-b border-line px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-small font-bold">{col.title}</h2>
                    <span className="tnum rounded-full bg-surface px-2 py-0.5 font-mono text-mono font-semibold text-txt-2">
                      {col.cards.length}
                    </span>
                  </div>
                  {pendentesPagamento > 0 && (
                    <p className="mt-1 text-[13px] text-txt-2">
                      Potencial: {BRL.format(pendentesPagamento * PRICE_EXECUTION)} pendente
                    </p>
                  )}
                </header>

                <ul className="flex-1 space-y-3 p-3" aria-label={`Processos em ${col.title}`}>
                  {col.cards.map((card) => (
                    <li
                      key={card.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/process-id', String(card.id))
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      className={cn(
                        'rounded-input border border-line bg-surface p-3 shadow-card-light',
                        movendoId === card.id && 'opacity-50',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 size-4 shrink-0 text-txt-2" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{card.name}</p>
                          <p className="truncate text-[13px] text-txt-2">
                            {card.uf ?? 'UF —'} · {card.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <SlaChip createdAt={card.createdAt} />
                        <PagamentoBadge paidAt={card.paidAt} />
                      </div>
                      <div className="mt-2">
                        <label htmlFor={`mover-${card.id}`} className="sr-only">
                          Mover {card.name} para outra etapa
                        </label>
                        <select
                          id={`mover-${card.id}`}
                          value=""
                          disabled={movendoId === card.id}
                          onChange={(e) => {
                            const alvo = e.target.value as StageKey
                            if (alvo) pedirMovimento(card, alvo)
                          }}
                          className="min-h-[40px] w-full rounded-input border border-line bg-surface px-2 text-[13px]"
                        >
                          <option value="">Mover para…</option>
                          {STAGES.filter((s) => s.key !== card.currentStage).map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.title}
                              {s.order < STAGE_MAP[card.currentStage as StageKey].order ? ' (voltar)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </li>
                  ))}
                  {col.cards.length === 0 && (
                    <li className="rounded-input border border-dashed border-line px-3 py-6 text-center text-[13px] text-txt-2">
                      Nenhum processo nesta etapa
                    </li>
                  )}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      {/* Confirmação de movimento para trás */}
      {confirmBack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label="Confirmar retorno de etapa">
          <button
            type="button"
            aria-label="Cancelar"
            className="absolute inset-0 bg-ink-950/50"
            onClick={() => setConfirmBack(null)}
          />
          <div className="relative w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-card-light">
            <h2 className="text-h3 font-semibold">Voltar etapa?</h2>
            <p className="mt-2 text-body">
              Mover <strong>{confirmBack.card.name}</strong> de “
              {STAGE_MAP[confirmBack.card.currentStage as StageKey].title}” de volta para “
              {STAGE_MAP[confirmBack.toStage].title}” reabre essa etapa e devolve as seguintes para
              pendente. Essa mudança fica registrada no log de auditoria.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmBack(null)}
                className="min-h-[44px] rounded-btn border border-line px-4 font-bold hover:bg-bg-alt"
                autoFocus
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void executarMovimento(confirmBack.card, confirmBack.toStage)}
                className="min-h-[44px] rounded-btn bg-danger px-4 font-bold text-white hover:opacity-90"
              >
                Confirmar retorno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

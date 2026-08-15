import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, Clock, RotateCcw } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { PRICE_EXECUTION, STAGE_MAP, type StageKey } from '@contracts/constants'
import { cn } from '@/lib/utils'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const DATE_FMT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

interface ProcessoRow {
  id: number
  userId: number
  name: string
  email: string
  uf: string | null
  currentStage: string
  paidAt: string | Date | null
  createdAt: string | Date
}

function Modal({
  titulo,
  onClose,
  children,
}: {
  titulo: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" aria-label="Cancelar" className="absolute inset-0 bg-ink-950/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-card-light">
        {children}
      </div>
    </div>
  )
}

function StatusBadge({ paidAt }: { paidAt: string | Date | null }) {
  if (paidAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-success bg-moss-400/10 px-2.5 py-0.5 text-[13px] font-bold text-success">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Confirmado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-warn bg-amber-400/10 px-2.5 py-0.5 text-[13px] font-bold text-warn">
      <Clock className="size-3.5" aria-hidden="true" />
      Aguardando
    </span>
  )
}

export default function AdminPagamentos() {
  const utils = trpc.useUtils()
  const processes = trpc.admin.processes.useQuery()
  const confirm = trpc.payments.adminConfirm.useMutation()
  const refund = trpc.payments.adminRefund.useMutation()

  const [confirmando, setConfirmando] = useState<ProcessoRow | null>(null)
  const [estornando, setEstornando] = useState<ProcessoRow | null>(null)
  const [motivo, setMotivo] = useState('')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const motivoRef = useRef<HTMLTextAreaElement>(null)

  const { pendentes, historico } = useMemo(() => {
    const rows: ProcessoRow[] = (processes.data?.columns ?? []).flatMap((c) => c.cards)
    const ord = (a: ProcessoRow, b: ProcessoRow) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return {
      pendentes: rows.filter((r) => !r.paidAt).sort(ord),
      historico: rows
        .filter((r) => r.paidAt)
        .sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime()),
    }
  }, [processes.data])

  async function confirmarPagamento(row: ProcessoRow) {
    setMsg(null)
    try {
      await confirm.mutateAsync({ userId: row.userId })
      await utils.admin.processes.invalidate()
      await utils.admin.kpis.invalidate()
      setMsg({
        tipo: 'ok',
        texto: `Pagamento de ${row.name} confirmado. Acompanhamento completo liberado e e-mail enviado.`,
      })
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro inesperado.' })
    } finally {
      setConfirmando(null)
    }
  }

  async function estornar(row: ProcessoRow) {
    if (motivo.trim().length < 3) {
      motivoRef.current?.focus()
      return
    }
    setMsg(null)
    try {
      await refund.mutateAsync({ userId: row.userId, motivo: motivo.trim() })
      await utils.admin.processes.invalidate()
      await utils.admin.kpis.invalidate()
      setMsg({ tipo: 'ok', texto: `Pagamento de ${row.name} estornado. Motivo registrado no log.` })
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro inesperado.' })
    } finally {
      setEstornando(null)
      setMotivo('')
    }
  }

  const selectClass = 'tnum font-mono text-mono'

  return (
    <div className="mx-auto max-w-wide space-y-6">
      <div>
        <h1 className="text-h1 font-medium">Pagamentos</h1>
        <p className="mt-1 text-small text-txt-2">
          Acompanhamento completo: {BRL.format(PRICE_EXECUTION)} (pagamento único). Confirme vendas
          fechadas no WhatsApp e gerencie estornos.
        </p>
      </div>

      <div role="status" aria-live="polite" className="min-h-6">
        {msg && (
          <p
            className={cn(
              'rounded-input border px-4 py-2 text-small font-bold',
              msg.tipo === 'erro'
                ? 'border-danger bg-coral-400/10 text-danger'
                : 'border-success bg-moss-400/10 text-success',
            )}
          >
            {msg.texto}
          </p>
        )}
      </div>

      {processes.isLoading && <p role="status" className="text-lead text-txt-2">Carregando…</p>}
      {processes.error && (
        <p role="alert" className="rounded-card border border-danger bg-surface p-4 font-bold text-danger">
          Erro ao carregar pagamentos: {processes.error.message}
        </p>
      )}

      {processes.data && (
        <>
          {/* Pendências */}
          <section aria-label="Pendências de pagamento">
            <h2 className="text-h3 font-semibold">
              Aguardando confirmação ({pendentes.length})
            </h2>
            <div className="mt-3 overflow-x-auto rounded-card border border-line bg-surface shadow-card-light">
              <table className="w-full min-w-[760px] text-left text-small">
                <caption className="sr-only">Processos com pagamento pendente</caption>
                <thead className="bg-bg-alt">
                  <tr className="border-b border-line">
                    <th scope="col" className="px-4 py-3">Cliente</th>
                    <th scope="col" className="px-4 py-3">UF</th>
                    <th scope="col" className="px-4 py-3">Etapa atual</th>
                    <th scope="col" className="px-4 py-3">Cadastro</th>
                    <th scope="col" className="px-4 py-3">Valor</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes.map((row, i) => (
                    <tr key={row.id} className={cn('border-b border-line/60', i % 2 === 1 && 'bg-bg-alt/40')}>
                      <th scope="row" className="px-4 py-3">
                        <span className="block font-bold">{row.name}</span>
                        <span className="block text-[13px] font-normal text-txt-2">{row.email}</span>
                      </th>
                      <td className="px-4 py-3">{row.uf ?? '—'}</td>
                      <td className="px-4 py-3">{STAGE_MAP[row.currentStage as StageKey]?.short ?? row.currentStage}</td>
                      <td className={cn('px-4 py-3', selectClass)}>{DATE_FMT.format(new Date(row.createdAt))}</td>
                      <td className={cn('px-4 py-3 font-semibold', selectClass)}>{BRL.format(PRICE_EXECUTION)}</td>
                      <td className="px-4 py-3"><StatusBadge paidAt={row.paidAt} /></td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setConfirmando(row)}
                          className="min-h-[44px] whitespace-nowrap rounded-btn bg-accent px-4 font-bold text-on-accent hover:bg-accent-hover"
                        >
                          Confirmar pagamento
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendentes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-txt-2">
                        Nenhuma pendência de pagamento. Tudo em dia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Histórico */}
          <section aria-label="Histórico de pagamentos confirmados">
            <h2 className="text-h3 font-semibold">Confirmados ({historico.length})</h2>
            <div className="mt-3 overflow-x-auto rounded-card border border-line bg-surface shadow-card-light">
              <table className="w-full min-w-[760px] text-left text-small">
                <caption className="sr-only">Histórico de pagamentos confirmados</caption>
                <thead className="bg-bg-alt">
                  <tr className="border-b border-line">
                    <th scope="col" className="px-4 py-3">Cliente</th>
                    <th scope="col" className="px-4 py-3">UF</th>
                    <th scope="col" className="px-4 py-3">Pago em</th>
                    <th scope="col" className="px-4 py-3">Valor</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((row, i) => (
                    <tr key={row.id} className={cn('border-b border-line/60', i % 2 === 1 && 'bg-bg-alt/40')}>
                      <th scope="row" className="px-4 py-3">
                        <span className="block font-bold">{row.name}</span>
                        <span className="block text-[13px] font-normal text-txt-2">{row.email}</span>
                      </th>
                      <td className="px-4 py-3">{row.uf ?? '—'}</td>
                      <td className={cn('px-4 py-3', selectClass)}>
                        {row.paidAt ? DATE_FMT.format(new Date(row.paidAt)) : '—'}
                      </td>
                      <td className={cn('px-4 py-3 font-semibold', selectClass)}>{BRL.format(PRICE_EXECUTION)}</td>
                      <td className="px-4 py-3"><StatusBadge paidAt={row.paidAt} /></td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEstornando(row)
                            setMotivo('')
                          }}
                          className="flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-btn border border-danger px-4 font-bold text-danger hover:bg-coral-400/10"
                        >
                          <RotateCcw className="size-4" aria-hidden="true" />
                          Estornar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {historico.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-txt-2">
                        Nenhum pagamento confirmado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Modal: confirmar pagamento */}
      {confirmando && (
        <Modal titulo="Confirmar pagamento" onClose={() => setConfirmando(null)}>
          <h2 className="text-h3 font-semibold">Confirmar pagamento</h2>
          <p className="mt-2 text-body">
            Isso desbloqueia o acompanhamento completo de <strong>{confirmando.name}</strong> (
            {BRL.format(PRICE_EXECUTION)}) e envia o e-mail de confirmação na hora. Confirmar?
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmando(null)}
              className="min-h-[44px] rounded-btn border border-line px-4 font-bold hover:bg-bg-alt"
              autoFocus
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void confirmarPagamento(confirmando)}
              disabled={confirm.isPending}
              className="min-h-[44px] rounded-btn bg-accent px-4 font-bold text-on-accent hover:bg-accent-hover disabled:opacity-60"
            >
              {confirm.isPending ? 'Confirmando…' : 'Confirmar pagamento'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: estorno */}
      {estornando && (
        <Modal titulo="Estornar pagamento" onClose={() => setEstornando(null)}>
          <h2 className="text-h3 font-semibold">Estornar pagamento</h2>
          <p className="mt-2 text-body">
            O acesso de <strong>{estornando.name}</strong> ao acompanhamento completo será
            bloqueado novamente. O motivo fica registrado no log de auditoria.
          </p>
          <label htmlFor="motivo-estorno" className="mt-4 block text-small font-bold">
            Motivo do estorno (obrigatório)
          </label>
          <textarea
            id="motivo-estorno"
            ref={motivoRef}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            required
            aria-required="true"
            className="mt-1 w-full rounded-input border border-line bg-surface px-3 py-2 text-small"
            placeholder="Ex.: chargeback no cartão, desistência em 7 dias…"
          />
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setEstornando(null)}
              className="min-h-[44px] rounded-btn border border-line px-4 font-bold hover:bg-bg-alt"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void estornar(estornando)}
              disabled={refund.isPending || motivo.trim().length < 3}
              className="min-h-[44px] rounded-btn bg-danger px-4 font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {refund.isPending ? 'Estornando…' : 'Confirmar estorno'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

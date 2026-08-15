import { useEffect, useMemo, useRef, useState } from 'react'
import type { inferRouterOutputs } from '@trpc/server'
import { Download, MessageCircle, Search, X } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { UF_LIST, type QuizAnswers } from '@contracts/constants'
import type { AppRouter } from '../../../api/router'
import { cn } from '@/lib/utils'

type RouterOutputs = inferRouterOutputs<AppRouter>
type LeadRow = RouterOutputs['admin']['leads'][number]
type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost'
type LeadSource = 'simulator' | 'quiz' | 'site'

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Novo',
  contacted: 'Em contato',
  converted: 'Convertido',
  lost: 'Perdido',
}
const STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'border-line bg-bg-alt text-txt',
  contacted: 'border-warn bg-amber-400/10 text-warn',
  converted: 'border-success bg-moss-400/10 text-success',
  lost: 'border-danger bg-coral-400/10 text-danger',
}
const SOURCE_LABELS: Record<LeadSource, string> = {
  simulator: 'Simulador',
  quiz: 'Pré-análise',
  site: 'Site',
}

const QUIZ_LABELS: Partial<Record<keyof QuizAnswers, string>> = {
  paraQuem: 'Para quem é',
  disabilityType: 'Tipo de deficiência',
  teaSupportLevel: 'Nível de suporte TEA',
  cnhRestriction: 'CNH com restrição',
  laudoStatus: 'Laudo médico',
  carroExistente: 'Carro com isenção anterior',
  debitos: 'Débitos com a fazenda',
  faixaPreco: 'Faixa de preço',
  quandoComprar: 'Quando quer comprar',
}
const QUIZ_VALUES: Record<string, Record<string, string>> = {
  paraQuem: {
    eu_condutor: 'Para mim — eu dirijo',
    eu_nao_condutor: 'Para mim — não dirijo',
    filho_dependente: 'Para filho(a)/dependente',
    outro_familiar: 'Para outro familiar',
  },
  disabilityType: {
    fisica: 'Física',
    visual: 'Visual',
    auditiva: 'Auditiva',
    intelectual: 'Intelectual',
    tea: 'Autismo (TEA)',
    multipla: 'Múltipla',
    outra: 'Outra',
  },
  laudoStatus: { recente: 'Tem laudo recente', antigo: 'Laudo antigo', nenhum: 'Sem laudo' },
  carroExistente: {
    nenhum: 'Nenhum',
    com_isencao: 'Tem carro com isenção',
    sem_isencao: 'Tem carro sem isenção',
  },
  debitos: { nao: 'Não', sim: 'Sim', nao_sei: 'Não sabe' },
  faixaPreco: {
    ate70: 'Até R$ 70 mil',
    '70a120': 'R$ 70–120 mil',
    '120a200': 'R$ 120–200 mil',
    nao_sei: 'Não sabe',
  },
  quandoComprar: { '3meses': 'Em até 3 meses', '3a6meses': 'Em 3–6 meses', pesquisando: 'Pesquisando' },
  cnhRestriction: { sim: 'Sim', nao: 'Não', sem_cnh_especial: 'Sem CNH especial' },
}

const DATE_FMT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

function quizSummary(quizAnswers: unknown): { label: string; value: string }[] {
  if (!quizAnswers || typeof quizAnswers !== 'object') return []
  const answers = quizAnswers as Record<string, unknown>
  const rows: { label: string; value: string }[] = []
  for (const [key, label] of Object.entries(QUIZ_LABELS)) {
    const raw = answers[key]
    if (raw === undefined || raw === null || raw === '') continue
    const text = QUIZ_VALUES[key]?.[String(raw)] ?? String(raw)
    rows.push({ label, value: text })
  }
  // Campo livre do simulador (vehicleSlug)
  if (typeof answers.vehicleSlug === 'string') {
    rows.push({ label: 'Veículo simulado', value: answers.vehicleSlug })
  }
  return rows
}

function whatsappDigits(whatsapp: string): string {
  return whatsapp.replace(/\D/g, '')
}

function LeadDrawer({ lead, onClose }: { lead: LeadRow; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const quiz = quizSummary(lead.quizAnswers)
  const wa = whatsappDigits(lead.whatsapp)
  const waText = encodeURIComponent(
    `Olá, ${lead.name.split(' ')[0]}! Aqui é da equipe IsentaPCD. Vi seu interesse na isenção de impostos para carro PCD e posso te ajudar com os próximos passos.`,
  )

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Detalhes do lead ${lead.name}`}>
      <button
        type="button"
        aria-label="Fechar detalhes do lead"
        className="absolute inset-0 bg-ink-950/50"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l border-line bg-surface shadow-card-light">
        <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-h3 font-semibold">{lead.name}</h2>
            <p className="mt-1 text-small text-txt-2">
              {SOURCE_LABELS[lead.source as LeadSource] ?? lead.source} ·{' '}
              {lead.uf ?? 'UF não informada'} · criado em {DATE_FMT.format(new Date(lead.createdAt))}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-11 shrink-0 items-center justify-center rounded-btn hover:bg-bg-alt"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-6 px-6 py-5">
          <section aria-label="Status e contato">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-small font-bold',
                  STATUS_STYLES[lead.status as LeadStatus] ?? STATUS_STYLES.new,
                )}
              >
                {STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}
              </span>
              <span className="tnum font-mono text-mono text-txt-2">{lead.whatsapp}</span>
            </div>
          </section>

          {/* Indicação em destaque */}
          <section
            aria-label="Indicação"
            className={cn(
              'rounded-card border p-4',
              lead.referredBy ? 'border-warn bg-amber-400/10' : 'border-line bg-bg-alt/60',
            )}
          >
            <h3 className="text-small font-bold">Indicação</h3>
            {lead.referredBy ? (
              <p className="mt-1 text-body">
                Indicado por <strong>{lead.referredBy}</strong>. Se converter, o indicador ganha R$
                100 de desconto.
              </p>
            ) : (
              <p className="mt-1 text-small text-txt-2">Sem indicação (chegou direto).</p>
            )}
          </section>

          <section aria-label="Respostas da pré-análise">
            <h3 className="text-small font-bold">Pré-análise (resumo)</h3>
            {quiz.length > 0 ? (
              <dl className="mt-2 space-y-2">
                {quiz.map((row) => (
                  <div key={row.label} className="flex flex-wrap gap-x-3 text-small">
                    <dt className="w-40 shrink-0 text-txt-2">{row.label}</dt>
                    <dd className="font-bold">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-1 text-small text-txt-2">
                Este lead não respondeu a pré-análise (captura direta).
              </p>
            )}
          </section>
        </div>

        <div className="border-t border-line px-6 py-4">
          <a
            href={`https://wa.me/55${wa}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-whatsapp-light px-4 font-bold text-white hover:opacity-90"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            Abrir WhatsApp
          </a>
        </div>
      </aside>
    </div>
  )
}

export default function AdminLeads() {
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')
  const [uf, setUf] = useState('')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [limit, setLimit] = useState(25)
  const [selecionado, setSelecionado] = useState<LeadRow | null>(null)
  const [csvMsg, setCsvMsg] = useState('')

  const filtros = useMemo(
    () => ({
      ...(uf ? { uf: uf as (typeof UF_LIST)[number] } : {}),
      ...(status ? { status: status as LeadStatus } : {}),
      ...(source ? { source: source as LeadSource } : {}),
      ...(buscaAtiva ? { busca: buscaAtiva } : {}),
    }),
    [uf, status, source, buscaAtiva],
  )

  const leads = trpc.admin.leads.useQuery({ ...filtros, limit, offset: 0 })
  const csv = trpc.admin.leadsCsv.useQuery(filtros, { enabled: false })

  async function exportarCsv() {
    setCsvMsg('Gerando CSV…')
    const res = await csv.refetch()
    if (res.error || !res.data) {
      setCsvMsg(`Falha ao exportar: ${res.error?.message ?? 'erro inesperado'}`)
      return
    }
    const blob = new Blob(['﻿' + res.data.csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = res.data.filename
    a.click()
    URL.revokeObjectURL(url)
    setCsvMsg(`Arquivo ${res.data.filename} baixado.`)
  }

  const rows = leads.data ?? []
  const selectClass =
    'min-h-[44px] rounded-input border border-line bg-surface px-3 text-small text-txt'

  return (
    <div className="mx-auto max-w-wide">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 font-medium">Leads</h1>
          <p className="mt-1 text-small text-txt-2">
            CRM de captação — simulador, pré-análise e site.
          </p>
        </div>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={csv.isFetching}
          className="flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-4 font-bold text-on-accent hover:bg-accent-hover disabled:opacity-60"
        >
          <Download className="size-4" aria-hidden="true" />
          {csv.isFetching ? 'Exportando…' : 'Exportar CSV'}
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-1 min-h-5 text-small text-txt-2">
        {csvMsg}
      </p>

      {/* Toolbar */}
      <form
        className="mt-4 flex flex-wrap items-end gap-3 rounded-card border border-line bg-surface p-4"
        onSubmit={(e) => {
          e.preventDefault()
          setLimit(25)
          setBuscaAtiva(busca.trim())
        }}
        aria-label="Filtros de leads"
      >
        <div className="min-w-56 flex-1">
          <label htmlFor="busca" className="block text-small font-bold">
            Buscar
          </label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-txt-2" aria-hidden="true" />
            <input
              id="busca"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome ou WhatsApp"
              className="min-h-[44px] w-full rounded-input border border-line bg-surface pl-9 pr-3 text-small"
            />
          </div>
        </div>
        <div>
          <label htmlFor="f-uf" className="block text-small font-bold">UF</label>
          <select id="f-uf" value={uf} onChange={(e) => { setUf(e.target.value); setLimit(25) }} className={cn(selectClass, 'mt-1')}>
            <option value="">Todas</option>
            {UF_LIST.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="block text-small font-bold">Status</label>
          <select id="f-status" value={status} onChange={(e) => { setStatus(e.target.value); setLimit(25) }} className={cn(selectClass, 'mt-1')}>
            <option value="">Todos</option>
            {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-origem" className="block text-small font-bold">Origem</label>
          <select id="f-origem" value={source} onChange={(e) => { setSource(e.target.value); setLimit(25) }} className={cn(selectClass, 'mt-1')}>
            <option value="">Todas</option>
            {(Object.keys(SOURCE_LABELS) as LeadSource[]).map((s) => (
              <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="min-h-[44px] rounded-btn bg-ink-900 px-5 font-bold text-paper-50 hover:bg-ink-800"
        >
          Buscar
        </button>
      </form>

      {/* Tabela */}
      <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface shadow-card-light">
        <table className="w-full min-w-[860px] text-left text-small">
          <caption className="sr-only">Lista de leads com filtros aplicados</caption>
          <thead className="sticky top-0 bg-bg-alt">
            <tr className="border-b border-line">
              <th scope="col" className="px-4 py-3">Nome</th>
              <th scope="col" className="px-4 py-3">WhatsApp</th>
              <th scope="col" className="px-4 py-3">UF</th>
              <th scope="col" className="px-4 py-3">Origem</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Indicação</th>
              <th scope="col" className="px-4 py-3">Criado em</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lead, i) => (
              <tr key={lead.id} className={cn('border-b border-line/60', i % 2 === 1 && 'bg-bg-alt/40')}>
                <th scope="row" className="px-4 py-3 font-bold">{lead.name}</th>
                <td className="tnum px-4 py-3 font-mono text-mono">{lead.whatsapp}</td>
                <td className="px-4 py-3">{lead.uf ?? '—'}</td>
                <td className="px-4 py-3">{SOURCE_LABELS[lead.source as LeadSource] ?? lead.source}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full border px-2.5 py-0.5 text-[13px] font-bold', STATUS_STYLES[lead.status as LeadStatus] ?? STATUS_STYLES.new)}>
                    {STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}
                  </span>
                </td>
                <td className="px-4 py-3">{lead.referredBy ?? '—'}</td>
                <td className="tnum px-4 py-3 font-mono text-mono">{DATE_FMT.format(new Date(lead.createdAt))}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setSelecionado(lead)}
                    className="min-h-[40px] rounded-btn border border-line px-3 font-bold hover:bg-bg-alt"
                  >
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
            {!leads.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-txt-2">
                  Nenhum lead com esses filtros. Tente limpar a busca.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {leads.isLoading && <p role="status" className="text-small text-txt-2">Carregando…</p>}
        {leads.error && (
          <p role="alert" className="text-small font-bold text-danger">
            Erro ao carregar leads: {leads.error.message}
          </p>
        )}
        {!leads.isLoading && rows.length >= limit && (
          <button
            type="button"
            onClick={() => setLimit((v) => v + 25)}
            className="min-h-[44px] rounded-btn border border-line bg-surface px-5 font-bold hover:bg-bg-alt"
          >
            Carregar mais
          </button>
        )}
        <p className="text-small text-txt-2" role="status">
          {rows.length} {rows.length === 1 ? 'lead exibido' : 'leads exibidos'}
        </p>
      </div>

      {selecionado && <LeadDrawer lead={selecionado} onClose={() => setSelecionado(null)} />}
    </div>
  )
}

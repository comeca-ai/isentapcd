import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  FileText,
  Flag,
  Gift,
  Lock,
  MessageCircle,
  PartyPopper,
  RefreshCw,
  Sparkles,
  Upload,
  UserPlus,
  X,
} from 'lucide-react'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '../../../api/router'
import AppShell from '@/components/app/AppShell'
import { useNow } from '@/components/app/useNow'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { WHATSAPP_URL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  DOC_TYPE_MAP,
  FEDERAL,
  PAYWALL_ENABLED,
  PRICE_EXECUTION,
  REFERRAL_REWARD,
  REGULATORY_DEADLINE,
  STAGE_MAP,
  UF_MATRIX,
  type StageStatus,
  type Uf,
} from '@contracts/constants'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const DISMISS_KEY = 'isentapcd:dismiss:pre-analise'
const FEED_SEEN_KEY = 'isentapcd:feed:last-seen'

/** Dashboard (/app) — modo claro, ferramenta de trabalho (app-dashboard.md). */
export default function Dashboard() {
  const { user } = useAuth()
  const reduced = useReducedMotion()

  const timeline = trpc.stages.timeline.useQuery(undefined, { retry: false })
  const feed = trpc.events.feed.useQuery(undefined, { retry: false })
  const checklist = trpc.documents.checklist.useQuery(undefined, { retry: false })
  const referrals = trpc.referrals.myReferrals.useQuery(undefined, { retry: false })
  const share = trpc.referrals.shareText.useQuery(undefined, { retry: false })
  const profile = trpc.profile.get.useQuery(undefined, { retry: false })

  const stages = useMemo(() => timeline.data?.stages ?? [], [timeline.data])
  const paid = Boolean(timeline.data?.paidAt)
  const doneCount = stages.filter((s) => s.status === 'done').length
  const totalStages = stages.length || 7
  const currentStage = stages.find((s) => s.status !== 'done') ?? null
  const firstName = user?.name?.trim().split(' ')[0] ?? ''

  // Banner de pré-análise: some quando a etapa 1 está concluída ou ao dispensar (persiste).
  const [dismissed, setDismissed] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1',
  )
  const descobertaDone =
    stages.find((s) => s.key === 'descoberta')?.status === 'done'
  const showPreAnaliseBanner = !dismissed && !descobertaDone && !timeline.isError

  function dismissBanner() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const fade = (i: number) =>
    ({
      initial: reduced ? false : { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: reduced ? 0 : 0.5, ease: EASE, delay: reduced ? 0 : i * 0.06 },
    }) as const

  return (
    <AppShell>
      <div className="mx-auto flex max-w-content flex-col gap-6">
        {/* Banner de pré-análise (dismissível, persiste em localStorage) */}
        {showPreAnaliseBanner && (
          <motion.div {...fade(0)}>
            <div
              role="region"
              aria-label="Pré-análise gratuita"
              className="flex flex-wrap items-center gap-3 rounded-card border border-success/40 bg-success/10 px-5 py-4"
            >
              <Sparkles className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
              <p className="min-w-0 flex-1 basis-full text-small font-medium text-txt sm:basis-0">
                Ainda não fez a pré-análise? São 2 minutos e ela monta seu mapa.
              </p>
              <Link
                to="/pre-analise"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-4 text-small font-bold text-on-accent transition-colors hover:bg-accent-hover"
              >
                Fazer pré-análise
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Dispensar aviso de pré-análise"
                className="inline-flex h-11 w-11 items-center justify-center rounded-btn text-txt-2 transition-colors hover:bg-surface hover:text-txt"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Erro de carregamento — nunca tela branca */}
        {timeline.isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-4 rounded-card border border-danger/40 bg-danger/5 p-6"
          >
            <AlertTriangle className="h-6 w-6 shrink-0 text-danger" aria-hidden="true" />
            <p className="flex-1 text-body font-medium text-txt">
              Não conseguimos carregar seu processo agora. Verifique sua conexão.
            </p>
            <button
              type="button"
              onClick={() => void timeline.refetch()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-4 text-small font-bold text-on-accent hover:bg-accent-hover"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Tentar de novo
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Boas-vindas + anel de progresso */}
          <motion.section
            {...fade(0)}
            aria-labelledby="dash-boasvindas"
            className="rounded-card border border-line bg-surface p-6 shadow-card-light lg:p-8 xl:col-span-8"
          >
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <ProgressRing done={doneCount} total={totalStages} reduced={reduced} />
              <div className="min-w-0 flex-1">
                <h1 id="dash-boasvindas" className="font-display text-[1.75rem] font-medium leading-tight">
                  Olá, {firstName || 'você'} — seu processo está andando.
                </h1>
                <p className="mt-2 text-body text-txt-2">
                  Etapa atual:{' '}
                  <strong className="font-bold text-txt">
                    {currentStage ? currentStage.title : 'Tudo concluído'}
                  </strong>{' '}
                  ({doneCount} de {totalStages} concluídas)
                </p>
                {!paid && PAYWALL_ENABLED && (
                  <p className="mt-4 rounded-input border border-warn/40 bg-warn/10 px-4 py-3 text-small text-txt">
                    Você está no plano gratuito. Desbloqueie revisão humana, checklist completo e
                    suporte até a nota fiscal.{' '}
                    <Link
                      to="/app/pagamento"
                      className="font-bold text-accent underline underline-offset-4 hover:text-accent-hover"
                    >
                      Desbloquear por R$ {PRICE_EXECUTION} →
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </motion.section>

          {/* Countdowns de prazos */}
          <motion.div {...fade(1)} className="xl:col-span-4">
            <CountdownsCard
              events={feed.data}
              uf={profile.data?.uf as Uf | null | undefined}
              purchaseDate={profile.data?.purchaseDate ?? null}
            />
          </motion.div>

          {/* Timeline de etapas — o coração */}
          <motion.section
            {...fade(2)}
            aria-labelledby="dash-timeline"
            className="rounded-card border border-line bg-surface p-6 shadow-card-light lg:p-8 xl:col-span-8"
          >
            <h2 id="dash-timeline" className="text-h3 font-medium">
              Suas 7 etapas
            </h2>
            <p className="mt-1 text-small text-txt-2">
              Cada etapa depende da anterior — a gente te avisa quando destravar.
            </p>
            {timeline.isLoading ? (
              <p role="status" className="mt-6 text-small text-txt-2">
                Carregando etapas…
              </p>
            ) : (
              <ol className="mt-6 flex flex-col">
                {stages.map((stage, i) => (
                  <StageRow
                    key={stage.key}
                    stage={stage}
                    last={i === stages.length - 1}
                    docsMeta={
                      stage.key === 'documentos' && checklist.data
                        ? docsMetaText(checklist.data)
                        : null
                    }
                  />
                ))}
              </ol>
            )}
          </motion.section>

          {/* Widget de documentos */}
          <motion.div {...fade(3)} className="xl:col-span-4">
            <DocsWidget
              data={checklist.data}
              loading={checklist.isLoading}
              error={checklist.isError}
              onRetry={() => void checklist.refetch()}
            />
          </motion.div>

          {/* Feed de atividades */}
          <motion.section
            {...fade(4)}
            aria-labelledby="dash-feed"
            id="atividades"
            className="scroll-mt-24 rounded-card border border-line bg-surface p-6 shadow-card-light lg:p-8 xl:col-span-8"
          >
            <FeedCard events={feed.data} loading={feed.isLoading} />
          </motion.section>

          {/* Quem indica ganha */}
          <motion.div {...fade(5)} className="xl:col-span-4">
            <ReferralCard
              total={referrals.data?.total}
              convertidos={referrals.data?.convertidos}
              shareText={share.data?.text}
              whatsappUrl={share.data?.whatsappUrl}
            />
          </motion.div>
        </div>
      </div>
    </AppShell>
  )
}

// ── Anel de progresso ──────────────────────────────────────────────────────

function ProgressRing({
  done,
  total,
  reduced,
}: {
  done: number
  total: number
  reduced: boolean
}) {
  const pct = total > 0 ? done / total : 0
  const R = 46
  const C = 2 * Math.PI * R

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <div className="relative h-[120px] w-[120px]">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          role="progressbar"
          aria-valuenow={Math.round(pct * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso do processo: ${done} de ${total} etapas concluídas (${Math.round(pct * 100)}%)`}
        >
          {/* trilha */}
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--line)"
            strokeWidth="10"
          />
          {/* arco de progresso */}
          <motion.circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--success)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - pct) }}
            transition={{ duration: reduced ? 0 : 1, ease: 'easeOut' }}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div
          aria-hidden="true"
          className="tnum absolute inset-0 flex items-center justify-center font-mono text-[1.75rem] font-medium text-txt"
        >
          {Math.round(pct * 100)}%
        </div>
      </div>
      <p className="text-small text-txt-2">
        {done} de {total} etapas
      </p>
    </div>
  )
}

// ── Timeline de etapas ─────────────────────────────────────────────────────

const STATUS_UI: Record<
  StageStatus,
  { label: string; Icon: typeof Circle; cls: string }
> = {
  done: { label: 'Concluída', Icon: CheckCircle2, cls: 'border-success/40 bg-success/10 text-success' },
  in_progress: { label: 'Em andamento', Icon: RefreshCw, cls: 'border-warn/40 bg-warn/10 text-warn' },
  waiting_org: { label: 'Aguardando órgão', Icon: Clock, cls: 'border-warn/40 bg-warn/10 text-warn' },
  waiting_user: { label: 'Aguardando você', Icon: AlertCircle, cls: 'border-danger/40 bg-danger/10 text-danger' },
  blocked: { label: 'Bloqueada', Icon: Lock, cls: 'border-line bg-bg-alt text-txt-2' },
  pending: { label: 'Não iniciada', Icon: Circle, cls: 'border-line bg-bg-alt text-txt-2' },
}

type RouterOutputs = inferRouterOutputs<AppRouter>
type TimelineStage = RouterOutputs['stages']['timeline']['stages'][number]
type FeedEvent = RouterOutputs['events']['feed'][number]
type DocChecklist = RouterOutputs['documents']['checklist']

const STAGE_CTA: Record<string, { to: string; label: string }> = {
  descoberta: { to: '/pre-analise', label: 'Fazer pré-análise' },
  mapa: { to: '/guia', label: 'Ver orientações' },
  documentos: { to: '/app/documentos', label: 'Continuar checklist' },
}

function StageRow({
  stage,
  last,
  docsMeta,
}: {
  stage: TimelineStage
  last: boolean
  docsMeta: string | null
}) {
  const ui = STATUS_UI[stage.status] ?? STATUS_UI.pending
  const StatusIcon = ui.Icon
  const blockedByDeps = stage.blockedBy.length > 0
  const cta = STAGE_CTA[stage.key]

  return (
    <li className="relative flex gap-4">
      {/* Conector vertical entre etapas (dependência visual) */}
      {!last && (
        <span
          aria-hidden="true"
          className="absolute left-[19px] top-12 h-[calc(100%-3rem)] w-0.5 bg-line"
        />
      )}
      <span
        aria-hidden="true"
        className={cn(
          'z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
          ui.cls,
        )}
      >
        <StatusIcon className="h-5 w-5" />
      </span>

      <div className={cn('min-w-0 flex-1', !last && 'pb-6')}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-body font-bold text-txt">
            {stage.order}. {stage.title}
          </h3>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.8125rem] font-medium',
              ui.cls,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {ui.label}
          </span>
        </div>

        {stage.locked ? (
          /* Paywall inline (app-pagamento.md P2): blur + cadeado + CTA */
          <div className="relative mt-2 overflow-hidden rounded-input border border-line">
            <div
              aria-hidden="true"
              className="pointer-events-none select-none p-4 blur-[3px] opacity-60"
            >
              <p className="text-small text-txt-2">{stage.description}</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-start justify-center gap-2 bg-bg/60 p-4">
              <p className="flex items-center gap-2 text-small font-bold text-txt">
                <Lock className="h-4 w-4 text-txt-2" aria-hidden="true" />
                Disponível no acompanhamento completo
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/app/pagamento"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-4 text-small font-bold text-on-accent transition-colors hover:bg-accent-hover"
                >
                  Desbloquear por R$ {PRICE_EXECUTION}
                </Link>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-small font-medium text-txt-2 underline underline-offset-4 hover:text-txt"
                >
                  Ou fale no WhatsApp
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 text-small text-txt-2">{stage.description}</p>
            {/* Meta contextual + dependências em texto */}
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-small">
              {docsMeta && (
                <span className="inline-flex items-center gap-1.5 text-txt-2">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {docsMeta}
                </span>
              )}
              {blockedByDeps && (
                <span className="inline-flex items-center gap-1.5 font-medium text-txt-2">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Depende de: {stage.blockedBy.join(', ')}
                </span>
              )}
              {!blockedByDeps && stage.dependsOn.length > 0 && (
                <span className="text-txt-2">
                  Depende de: {stage.dependsOn.map((d) => d.title).join(', ')} ✓
                </span>
              )}
            </div>
            {cta && stage.status !== 'done' && (
              <Link
                to={cta.to}
                className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-accent px-4 text-small font-bold text-accent transition-colors hover:bg-accent/10"
              >
                {cta.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </>
        )}
      </div>
    </li>
  )
}

function docsMetaText(checklist: DocChecklist): string {
  const all = checklist.flatMap((g) => g.docs)
  const enviados = all.filter((d) => d.upload).length
  return `${enviados} de ${all.length} documentos enviados`
}

// ── Countdowns de prazos ───────────────────────────────────────────────────

interface CountdownItem {
  id: string
  label: string
  detail: string
  target: Date
  /** tom base: warn (regulatório) ou success (autorizações) */
  tone: 'warn' | 'success'
  /** texto extra quando faltam < 30 dias */
  urgentNote?: string
}

function lastStageDoneDate(events: FeedEvent[] | undefined, stageKey: string): Date | null {
  if (!events) return null
  const hit = events.find((e) => {
    if (e.kind !== 'stage_updated') return false
    const p = e.payload as { stageKey?: string; status?: string } | null
    return p?.stageKey === stageKey && p?.status === 'done'
  })
  return hit ? new Date(hit.createdAt) : null
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

function addYears(d: Date, years: number): Date {
  const out = new Date(d)
  out.setFullYear(out.getFullYear() + years)
  return out
}

const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR')
const fmtMonthYear = (d: Date) =>
  d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })

function CountdownsCard({
  events,
  uf,
  purchaseDate,
}: {
  events: FeedEvent[] | undefined
  uf: Uf | null | undefined
  purchaseDate: string | null
}) {
  const now = useNow()
  const items = useMemo<CountdownItem[]>(() => {
    const list: CountdownItem[] = [
      {
        id: 'regulatorio',
        label: 'Regras atuais',
        detail: 'Regime vigente garantido até 31/12/2026 — quem começa agora trava a regra atual.',
        target: new Date(`${REGULATORY_DEADLINE}T23:59:59-03:00`),
        tone: 'warn',
      },
    ]

    const ipiDone = lastStageDoneDate(events, 'ipi')
    if (ipiDone) {
      list.push({
        id: 'ipi',
        label: 'Autorização de IPI',
        detail: `Válida por ${FEDERAL.IPI_SISEN_AUTHORIZATION_DAYS} dias (expira ${fmtDate(
          addDays(ipiDone, FEDERAL.IPI_SISEN_AUTHORIZATION_DAYS),
        )}).`,
        target: addDays(ipiDone, FEDERAL.IPI_SISEN_AUTHORIZATION_DAYS),
        tone: 'success',
        urgentNote: 'Atenção: reagende a compra antes do vencimento.',
      })
    }

    const icmsDone = lastStageDoneDate(events, 'icms')
    if (icmsDone) {
      const dias =
        (uf && UF_MATRIX[uf]?.icms.autorizacaoDias) || FEDERAL.ICMS_AUTHORIZATION_DAYS
      list.push({
        id: 'icms',
        label: 'Autorização de ICMS',
        detail: `Válida por ${dias} dias (expira ${fmtDate(addDays(icmsDone, dias))}).`,
        target: addDays(icmsDone, dias),
        tone: 'success',
        urgentNote: 'Atenção: reagende a compra antes do vencimento.',
      })
    }

    if (purchaseDate) {
      const compra = new Date(`${purchaseDate}T12:00:00`)
      const prazoIpva = uf ? UF_MATRIX[uf]?.ipva.prazoPosCompraDias : null
      if (prazoIpva) {
        list.push({
          id: 'ipva',
          label: `Prazo do pedido de IPVA (${uf})`,
          detail: `Protocolar até ${fmtDate(addDays(compra, prazoIpva))} (${prazoIpva} dias após a compra).`,
          target: addDays(compra, prazoIpva),
          tone: 'success',
          urgentNote: 'Atenção: prazo de IPVA perto do fim.',
        })
      }
      list.push({
        id: 'carencia-ipi',
        label: 'Carência do IPI',
        detail: `Pode vender sem devolver o IPI a partir de ${fmtMonthYear(
          addYears(compra, FEDERAL.IPI_SALE_LOCK_YEARS),
        )}.`,
        target: addYears(compra, FEDERAL.IPI_SALE_LOCK_YEARS),
        tone: 'success',
      })
      list.push({
        id: 'carencia-icms',
        label: 'Carência do ICMS',
        detail: `Pode vender sem devolver o ICMS a partir de ${fmtMonthYear(
          addYears(compra, FEDERAL.ICMS_LOCK_YEARS),
        )}.`,
        target: addYears(compra, FEDERAL.ICMS_LOCK_YEARS),
        tone: 'success',
      })
    }
    return list
  }, [events, uf, purchaseDate])

  const personal = items.filter((i) => i.id !== 'regulatorio')

  return (
    <section
      aria-labelledby="dash-prazos"
      className="h-full rounded-card border border-line bg-surface p-6 shadow-card-light"
    >
      <h2 id="dash-prazos" className="flex items-center gap-2 text-h3 font-medium">
        <Clock className="h-5 w-5 text-txt-2" aria-hidden="true" />
        Seus prazos
      </h2>
      <ul className="mt-4 flex flex-col gap-4">
        {items.map((item) => (
          <CountdownRow key={item.id} item={item} now={now} />
        ))}
      </ul>
      {personal.length === 0 && (
        <p className="mt-3 text-small text-txt-2">
          Sem prazos ativos ainda — eles aparecem quando suas autorizações saírem.
        </p>
      )}
    </section>
  )
}

function CountdownRow({ item, now }: { item: CountdownItem; now: number }) {
  const daysLeft = Math.max(0, Math.ceil((item.target.getTime() - now) / 86_400_000))
  const urgent = item.urgentNote !== undefined && daysLeft > 0 && daysLeft < 30
  const expired = daysLeft === 0
  const toneCls = expired || urgent ? 'text-danger' : item.tone === 'warn' ? 'text-warn' : 'text-success'

  return (
    <li className="border-b border-line pb-4 last:border-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-small font-bold text-txt">{item.label}</p>
        <p className={cn('tnum font-mono text-mono font-semibold', toneCls)}>
          {expired ? 'vencido' : `${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`}
        </p>
      </div>
      <p className="mt-0.5 text-small text-txt-2">{item.detail}</p>
      {urgent && !expired && (
        <p className="mt-1 flex items-center gap-1.5 text-small font-bold text-danger">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          {item.urgentNote}
        </p>
      )}
    </li>
  )
}

// ── Widget de documentos ───────────────────────────────────────────────────

function DocsWidget({
  data,
  loading,
  error,
  onRetry,
}: {
  data: DocChecklist | undefined
  loading: boolean
  error: boolean
  onRetry: () => void
}) {
  const groups = data ?? []
  const allDocs = groups.flatMap((g) => g.docs)
  const rejeitados = allDocs.filter((d) => d.upload?.status === 'rejected')
  const totalEnviados = allDocs.filter((d) => d.upload).length

  return (
    <section
      aria-labelledby="dash-docs"
      className="h-full rounded-card border border-line bg-surface p-6 shadow-card-light"
    >
      <h2 id="dash-docs" className="flex items-center gap-2 text-h3 font-medium">
        <FileText className="h-5 w-5 text-txt-2" aria-hidden="true" />
        Documentos
      </h2>

      {loading && (
        <p role="status" className="mt-4 text-small text-txt-2">
          Carregando checklist…
        </p>
      )}
      {error && (
        <div role="alert" className="mt-4">
          <p className="text-small text-txt-2">Não foi possível carregar o checklist.</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-4 text-small font-bold text-txt hover:bg-bg-alt"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tentar de novo
          </button>
        </div>
      )}

      {rejeitados.length > 0 && (
        <p className="mt-4 rounded-input border border-danger/40 bg-danger/5 px-4 py-3 text-small font-medium text-danger">
          <AlertCircle className="mr-1.5 inline h-4 w-4 align-[-2px]" aria-hidden="true" />
          {rejeitados.length === 1
            ? '1 documento rejeitado — '
            : `${rejeitados.length} documentos rejeitados — `}
          <Link to="/app/documentos" className="underline underline-offset-4">
            ver motivo
          </Link>
        </p>
      )}

      {groups.length > 0 && (
        <ul className="mt-4 flex flex-col gap-4">
          {groups.map((g) => {
            const enviados = g.docs.filter((d) => d.upload).length
            const total = g.docs.length
            const pct = total > 0 ? Math.round((enviados / total) * 100) : 0
            return (
              <li key={g.key}>
                <Link to="/app/documentos" className="group block">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-small font-bold text-txt group-hover:underline group-hover:underline-offset-4">
                      {g.title}
                    </p>
                    <p className="tnum font-mono text-mono text-txt-2">
                      {enviados}/{total}
                    </p>
                  </div>
                  <div
                    role="img"
                    aria-label={`${enviados} de ${total} documentos enviados em ${g.title}`}
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-alt"
                  >
                    <div
                      className="h-full rounded-full bg-success transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {totalEnviados === 0 && !loading && !error && (
        <div className="mt-4 text-center">
          <img src="/empty-docs.svg" alt="" className="mx-auto h-24 w-auto" />
          <p className="mt-2 text-small text-txt-2">
            Nenhum documento enviado ainda. Comece pelo checklist.
          </p>
        </div>
      )}

      <Link
        to="/app/documentos"
        className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-accent px-4 text-small font-bold text-accent transition-colors hover:bg-accent/10"
      >
        Abrir meus documentos
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  )
}

// ── Feed de atividades ─────────────────────────────────────────────────────

function feedItem(kind: string, payload: unknown): { text: string; Icon: typeof Bell } | null {
  const p = (payload ?? {}) as Record<string, unknown>
  const docLabel =
    typeof p.docType === 'string' ? (DOC_TYPE_MAP[p.docType]?.label ?? 'documento') : 'documento'
  const stageTitle =
    typeof p.stageKey === 'string' ? (STAGE_MAP[p.stageKey as keyof typeof STAGE_MAP]?.title ?? 'etapa') : 'etapa'

  switch (kind) {
    case 'user_registered':
      return { text: 'Bem-vindo(a)! Sua conta foi criada — comece pela pré-análise.', Icon: PartyPopper }
    case 'user_login':
      return null // ruído: não exibir acessos no feed
    case 'document_uploaded':
      return { text: `Documento enviado para revisão: ${docLabel}.`, Icon: Upload }
    case 'document_approved':
      return { text: `Documento aprovado na revisão: ${docLabel}.`, Icon: CheckCircle2 }
    case 'document_rejected': {
      const reason = typeof p.reason === 'string' && p.reason ? ` Motivo: ${p.reason}` : ''
      return { text: `Documento rejeitado: ${docLabel}.${reason}`, Icon: AlertCircle }
    }
    case 'document_removed':
      return { text: `Documento removido: ${docLabel}.`, Icon: FileText }
    case 'stage_updated':
      return { text: `Etapa atualizada: ${stageTitle}.`, Icon: Flag }
    case 'payment_confirmed':
      return { text: 'Pagamento confirmado — acompanhamento completo desbloqueado.', Icon: CheckCircle2 }
    case 'payment_refunded':
      return { text: 'Pagamento estornado. Fale com a gente se tiver dúvidas.', Icon: AlertCircle }
    case 'paywall_triggered':
      return {
        text: 'Você já tem guia paga — desbloqueie o acompanhamento completo para executarmos os protocolos.',
        Icon: Lock,
      }
    case 'profile_completed':
      return { text: 'Cadastro completo enviado. Obrigado!', Icon: CheckCircle2 }
    case 'password_changed':
      return { text: 'Sua senha foi alterada.', Icon: Lock }
    default:
      return { text: 'Atualização no seu processo.', Icon: Bell }
  }
}

function tempoRelativo(d: Date, now: number): string {
  const diff = now - new Date(d).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'agora mesmo'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const days = Math.floor(h / 24)
  if (days === 1) return 'há 1 dia'
  if (days < 30) return `há ${days} dias`
  return new Date(d).toLocaleDateString('pt-BR')
}

function FeedCard({ events, loading }: { events: FeedEvent[] | undefined; loading: boolean }) {
  const now = useNow()
  const [showAll, setShowAll] = useState(false)
  const [lastSeen, setLastSeen] = useState<number>(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(FEED_SEEN_KEY) : null
    return raw ? Number(raw) : 0
  })

  // Marca o feed como visto ao sair da página (itens novos ganham selo "Novo").
  useEffect(() => {
    return () => {
      localStorage.setItem(FEED_SEEN_KEY, String(Date.now()))
    }
  }, [])

  const items = useMemo(
    () =>
      (events ?? [])
        .map((e) => ({ event: e, view: feedItem(e.kind, e.payload) }))
        .filter((x): x is { event: FeedEvent; view: { text: string; Icon: typeof Bell } } => x.view !== null),
    [events],
  )
  const visible = showAll ? items : items.slice(0, 8)

  return (
    <>
      <h2 id="dash-feed" className="text-h3 font-medium">
        Atividades recentes
      </h2>
      {loading && (
        <p role="status" className="mt-4 text-small text-txt-2">
          Carregando atividades…
        </p>
      )}
      {!loading && items.length === 0 && (
        <p className="mt-4 text-small text-txt-2">
          Bem-vindo(a)! Comece pela pré-análise — suas atividades aparecem aqui.
        </p>
      )}
      <ul className="mt-4 flex flex-col">
        {visible.map(({ event, view }) => {
          const isNew = new Date(event.createdAt).getTime() > lastSeen
          return (
            <li
              key={event.id}
              className="flex items-start gap-3 border-b border-line py-3 last:border-0"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-alt text-txt-2"
              >
                <view.Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-small text-txt', isNew && 'font-bold')}>
                  {isNew && (
                    <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-warn/15 px-2 py-0.5 text-[0.75rem] font-bold text-warn">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-warn" />
                      Novo
                    </span>
                  )}
                  {view.text}
                </p>
                <p className="mt-0.5 text-[0.8125rem] text-txt-2">
                  <time dateTime={new Date(event.createdAt).toISOString()}>
                    {tempoRelativo(event.createdAt, now)}
                  </time>
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      {items.length > 8 && (
        <button
          type="button"
          onClick={() => {
            setShowAll((v) => !v)
            if (!showAll) setLastSeen(Date.now())
          }}
          className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-4 text-small font-bold text-txt transition-colors hover:bg-bg-alt"
          aria-expanded={showAll}
        >
          {showAll ? 'Ver menos' : `Ver tudo (${items.length})`}
        </button>
      )}
    </>
  )
}

// ── Card "Quem indica ganha" ───────────────────────────────────────────────

function ReferralCard({
  total,
  convertidos,
  shareText,
  whatsappUrl,
}: {
  total: number | undefined
  convertidos: number | undefined
  shareText: string | undefined
  whatsappUrl: string | undefined
}) {
  const [copied, setCopied] = useState(false)

  async function copyText() {
    if (!shareText) return
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 4000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      aria-labelledby="dash-indique"
      className="h-full rounded-card border border-danger/25 bg-danger/5 p-6 shadow-card-light"
    >
      <h2 id="dash-indique" className="flex items-center gap-2 text-h3 font-medium">
        <Gift className="h-5 w-5 text-danger" aria-hidden="true" />
        Quem indica ganha
      </h2>
      <p className="mt-2 text-small text-txt-2">
        Conhece alguém que também pode ter direito? Indique e ganhe{' '}
        <strong className="font-bold text-txt">R$ {REFERRAL_REWARD} de desconto</strong> por
        amigo que fechar o acompanhamento.
      </p>
      <p className="tnum mt-3 font-mono text-mono font-medium text-txt">
        <UserPlus className="mr-1.5 inline h-4 w-4 align-[-2px] text-txt-2" aria-hidden="true" />
        {total ?? 0} {total === 1 ? 'indicação' : 'indicações'} · {convertidos ?? 0}{' '}
        {convertidos === 1 ? 'convertida' : 'convertidas'}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <a
          href={whatsappUrl ?? WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-btn bg-whatsapp-light px-4 text-small font-bold text-white transition-colors hover:bg-whatsapp-dark active:scale-[0.98]"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Compartilhar no WhatsApp
        </a>
        <button
          type="button"
          onClick={() => void copyText()}
          disabled={!shareText}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-btn border border-line bg-surface px-4 text-small font-bold text-txt transition-colors hover:bg-bg-alt disabled:opacity-50"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          {copied ? 'Mensagem copiada!' : 'Copiar mensagem'}
        </button>
        <p aria-live="polite" className="sr-only">
          {copied ? 'Mensagem de indicação copiada para a área de transferência.' : ''}
        </p>
      </div>
    </section>
  )
}

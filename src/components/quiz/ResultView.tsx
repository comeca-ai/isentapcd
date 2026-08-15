import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  MessageCircle,
  ArrowRight,
  Landmark,
  MapPinned,
  CalendarClock,
  Scale,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'
import {
  UF_MATRIX,
  type EligibilityResult,
  type Uf,
} from '@contracts/constants'
import { formatBRL, WHATSAPP_URL } from '@/lib/constants'
import CountdownChip from '@/components/CountdownChip'
import TrustBadge from '@/components/TrustBadge'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { toTrustLevel } from '@/components/simulador/helpers'
import { BAND_PRICE, type QuizRecord } from './tree'

interface ResultViewProps {
  result: EligibilityResult
  answers: QuizRecord
}

const PERFIL_LABEL: Record<string, string> = {
  eu_condutor: 'você vai dirigir',
  eu_nao_condutor: 'você não dirige',
  filho_dependente: 'filho(a)/dependente',
  outro_familiar: 'familiar (responsável legal)',
}
const BAND_LABEL: Record<string, string> = {
  ate70: 'até R$ 70 mil',
  '70a120': 'R$ 70–120 mil',
  '120a200': 'R$ 120–200 mil',
  nao_sei: 'preço em aberto',
}

/** Economia estimada do resultado — cálculo REAL via trpc.simulator.calculate. */
function Economy({ answers }: { answers: QuizRecord }) {
  const preco = BAND_PRICE[answers.faixaPreco] ?? null
  const uf = answers.uf as Uf
  const q = trpc.simulator.calculate.useQuery(
    { preco: preco ?? 0, uf, combustivel: 'flex', isDriver: answers.paraQuem === 'eu_condutor' },
    { enabled: preco !== null, staleTime: 60_000 },
  )
  if (preco === null || !q.data) return null
  const r = q.data
  const ufRule = UF_MATRIX[uf]
  const lines = [
    {
      icon: <Landmark className="h-4 w-4 text-accent" aria-hidden="true" />,
      name: 'IPI',
      value: r.breakdown.ipi.valor > 0 ? formatBRL(r.breakdown.ipi.valor) : 'sem isenção',
      badge: <TrustBadge level="official" />,
    },
    {
      icon: <MapPinned className="h-4 w-4 text-accent" aria-hidden="true" />,
      name: 'ICMS',
      value:
        r.breakdown.icms.tipo === 'verificar'
          ? 'a confirmar'
          : r.breakdown.icms.valor
            ? formatBRL(r.breakdown.icms.valor)
            : 'sem isenção',
      badge: <TrustBadge level={toTrustLevel(ufRule.icms.confidence)} />,
    },
    {
      icon: <CalendarClock className="h-4 w-4 text-accent" aria-hidden="true" />,
      name: 'IPVA 1º ano',
      value:
        r.breakdown.ipva.percentualIsencao === 1
          ? 'isenção total'
          : r.breakdown.ipva.percentualIsencao === 0.6
            ? 'redução de 60%'
            : r.breakdown.ipva.percentualIsencao === 0
              ? 'sem isenção'
              : `a confirmar (SEFAZ-${uf})`,
      badge: <TrustBadge level={toTrustLevel(ufRule.ipva.confidence)} />,
    },
  ]
  return (
    <div className="rounded-card border border-line bg-surface p-6">
      <p className="text-small text-txt-2">
        Sua economia estimada (carro de {formatBRL(preco)} em {uf}):
      </p>
      {r.breakdown.total !== null && (
        <p className="mt-1 font-mono text-4xl font-semibold text-accent [font-variant-numeric:tabular-nums]">
          ≈ {formatBRL(r.breakdown.total)}
        </p>
      )}
      <ul className="mt-4 space-y-2">
        {lines.map((l) => (
          <li key={l.name} className="flex flex-wrap items-center gap-2 text-small">
            {l.icon}
            <span className="font-bold">{l.name}</span>
            <span className="font-mono text-mono text-txt">{l.value}</span>
            {l.badge}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Telas de resultado do quiz (quiz.md Q2) — 3 variantes com aria-live="polite":
 * R1 elegível (musgo), R2 elegível com pendências (âmbar), R3 não elegível (coral acolhedor).
 */
export default function ResultView({ result, answers }: ResultViewProps) {
  const reduced = useReducedMotion()
  const uf = answers.uf
  const chips = [
    uf,
    PERFIL_LABEL[answers.paraQuem] ?? '',
    BAND_LABEL[answers.faixaPreco] ?? '',
  ].filter(Boolean)

  // Caso cinzento com jurisprudência favorável (quiz.md R3)
  const casoCinzento =
    answers.visaoMonocular === 'sim' ||
    answers.disabilityType === 'outra' ||
    (answers.disabilityType === 'tea' &&
      (answers.teaSupportLevel === '1' || answers.teaSupportLevel === 'nao_sei'))

  const icon =
    result.status === 'elegivel' ? (
      <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
    ) : result.status === 'pendencias' ? (
      <AlertTriangle className="h-10 w-10" aria-hidden="true" />
    ) : (
      <HeartHandshake className="h-10 w-10" aria-hidden="true" />
    )
  const iconClasses =
    result.status === 'elegivel'
      ? 'bg-success/15 text-success'
      : result.status === 'pendencias'
        ? 'bg-warn/15 text-warn'
        : 'bg-danger/15 text-danger'

  const headline =
    result.status === 'elegivel'
      ? 'Boa notícia: você tem direito às isenções.'
      : result.status === 'pendencias'
        ? `Você tem direito — mas há ${result.pendencias.length} pendência(s) para resolver antes.`
        : 'Pelo que você contou, o caminho padrão não se aplica agora.'

  return (
    <motion.div
      aria-live="polite"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex w-full max-w-2xl flex-col gap-8"
    >
      <div className="text-center">
        <motion.span
          className={cn('mx-auto flex h-20 w-20 items-center justify-center rounded-full', iconClasses)}
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {icon}
        </motion.span>
        <h2 className="mt-4 font-display text-h2 font-medium [text-wrap:balance]">{headline}</h2>
        <ul className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Resumo do seu perfil">
          {chips.map((c) => (
            <li
              key={c}
              className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-mono text-txt-2"
            >
              {c}
            </li>
          ))}
        </ul>
      </div>

      {/* Pendências (R2 / R3) */}
      {result.pendencias.length > 0 && (
        <div className="rounded-card border border-warn/40 bg-bg-alt p-6">
          <h3 className="text-body font-bold text-warn">
            {result.status === 'pendencias' ? 'O que resolver antes' : 'O que está pesando no seu caso'}
          </h3>
          <ul className="mt-3 space-y-3">
            {result.pendencias.map((p) => (
              <li key={p} className="flex items-start gap-2 text-small text-txt">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings informativos */}
      {result.warnings.length > 0 && result.status !== 'nao_elegivel' && (
        <ul className="space-y-2">
          {result.warnings.map((w) => (
            <li key={w} className="flex items-start gap-2 text-small text-txt-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-txt-2" aria-hidden="true" />
              {w}
            </li>
          ))}
        </ul>
      )}

      {/* Economia estimada (R1/R2) */}
      {result.status !== 'nao_elegivel' && <Economy answers={answers} />}

      {/* Esperança realista (R3, casos cinzentos) */}
      {result.status === 'nao_elegivel' && casoCinzento && (
        <div className="rounded-card border border-line bg-surface p-6">
          <h3 className="flex items-center gap-2 text-body font-bold">
            <Scale className="h-5 w-5 text-accent" aria-hidden="true" />
            Mas atenção: seu caso pode ter caminho na Justiça
          </h3>
          <p className="mt-2 text-body text-txt-2">
            Casos como visão monocular, autismo nível 1 e outras deficiências fora da lista costumam
            ser negados no administrativo, mas têm decisões favoráveis do STF e do STJ. O guia
            explica o caminho passo a passo.
          </p>
        </div>
      )}

      {/* Próximos passos */}
      <ol className="space-y-3" aria-label="Seus próximos passos">
        {result.proximosPassos.map((p, i) => (
          <li key={p} className="flex items-start gap-3 rounded-card border border-line bg-surface p-4">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-mono font-semibold text-accent"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span className="text-body text-txt">{p}</span>
          </li>
        ))}
      </ol>

      {/* Aviso do relógio regulatório */}
      <div className="flex justify-center">
        <CountdownChip size="sm" context="regras atuais até 31/12/2026" />
      </div>

      {/* CTAs por variante */}
      {result.status === 'nao_elegivel' ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-btn bg-whatsapp-dark px-6 font-bold text-white transition-colors hover:brightness-110 active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Falar com uma pessoa no WhatsApp
          </a>
          <Link
            to="/guia"
            className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-btn border border-line px-6 font-medium text-txt transition-colors hover:border-accent/50"
          >
            Ler o capítulo Requisitos
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Link
            to="/app/pagamento"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-accent px-6 font-bold text-on-accent transition-all hover:bg-accent-hover hover:shadow-amber-glow active:scale-[0.98]"
          >
            Quero o acompanhamento completo (R$ 497)
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/registro"
              className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-btn border border-line px-6 font-medium text-txt transition-colors hover:border-accent/50"
            >
              Continuar grátis com o mapa
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-btn bg-whatsapp-dark px-6 font-medium text-white transition-colors hover:brightness-110 active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </motion.div>
  )
}

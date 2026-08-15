import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  Landmark,
  MapPinned,
  CalendarClock,
  ArrowRight,
  MessageCircle,
  AlertTriangle,
  Info,
} from 'lucide-react'
import {
  FEDERAL,
  UF_MATRIX,
  type SimulationResult,
  type Uf,
} from '@contracts/constants'
import { formatBRL, WHATSAPP_URL } from '@/lib/constants'
import TrustBadge from '@/components/TrustBadge'
import { cn } from '@/lib/utils'
import { toTrustLevel } from './helpers'

interface ResultPanelProps {
  result: SimulationResult | undefined
  isFetching: boolean
  uf: Uf
  isDriver: boolean
  vehicleName: string | null
  onOpenLead: () => void
}

function barWidth(valor: number | null, max: number): number {
  if (valor === null || max <= 0) return 0
  return Math.max(4, Math.round((valor / max) * 100))
}

/**
 * Coluna de resultado do simulador (simulador.md SM2) — número-herói,
 * breakdown IPI/ICMS/IPVA com TrustBadge por linha, chips de faixa,
 * nota honesta com warnings da UF, disclaimer de IPVA 1º ano e CTAs.
 * Região aria-live="polite": atualização ao vivo.
 */
export default function ResultPanel({
  result,
  isFetching,
  uf,
  isDriver,
  vehicleName,
  onOpenLead,
}: ResultPanelProps) {
  const reduced = useReducedMotion()
  const ufRule = UF_MATRIX[uf]

  const total = result?.breakdown.total ?? null
  const ipi = result?.breakdown.ipi
  const icms = result?.breakdown.icms
  const ipva = result?.breakdown.ipva

  const maxValor = Math.max(ipi?.valor ?? 0, icms?.valor ?? 0, 1)
  const hasWarning = (result?.warnings.length ?? 0) > 1 // além do disclaimer final

  const faixas: { ok: boolean; label: string }[] = []
  if (result) {
    faixas.push({
      ok: result.preco <= FEDERAL.IPI_CEILING,
      label:
        result.preco <= FEDERAL.IPI_CEILING
          ? `Carro ≤ ${formatBRL(FEDERAL.IPI_CEILING)} — IPI com isenção`
          : `Acima de ${formatBRL(FEDERAL.IPI_CEILING)} — sem IPI`,
    })
    if (icms?.tipo === 'integral')
      faixas.push({ ok: true, label: `≤ ${formatBRL(FEDERAL.ICMS_CEILING_FULL)} — ICMS total` })
    else if (icms?.tipo === 'parcial')
      faixas.push({ ok: true, label: 'R$ 70–120 mil — ICMS parcial (só a parcela de 70 mil)' })
    else if (icms?.tipo === 'nenhuma')
      faixas.push({ ok: false, label: 'Acima de R$ 120 mil — sem ICMS' })
  }

  return (
    <div
      aria-live="polite"
      className={cn(
        'flex flex-col gap-6 transition-opacity duration-200',
        isFetching && 'opacity-40',
      )}
    >
      {/* Número-herói */}
      <div>
        <p className="text-small text-txt-2">
          {vehicleName ? `Para ${vehicleName}` : 'Para este preço'} em {uf}
          {isDriver ? ', com você ao volante' : ', para quem não dirige'}:
        </p>
        {total !== null ? (
          <p className="mt-1">
            <motion.span
              key={Math.round(total)}
              initial={reduced ? false : { opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="font-mono text-[56px] font-semibold leading-none text-accent [font-variant-numeric:tabular-nums]"
            >
              ≈ {formatBRL(total)}
            </motion.span>
            <span className="mt-2 block text-body text-txt-2">
              de economia estimada no seu caso (IPI + ICMS na compra)
            </span>
          </p>
        ) : (
          <p className="mt-2 flex items-start gap-2 text-lead text-txt">
            <Info className="mt-1 h-5 w-5 shrink-0 text-warn" aria-hidden="true" />
            {result
              ? `Em ${uf} parte das regras precisa ser confirmada com a Sefaz — mostramos o que dá para cravar abaixo.`
              : 'Carregando estimativa…'}
          </p>
        )}
      </div>

      {/* Breakdown em 3 linhas com barras */}
      {result && (
        <ul className="flex flex-col gap-4" aria-label="Economia por imposto">
          {/* IPI */}
          <li>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-body font-bold">
                <Landmark className="h-5 w-5 text-accent" aria-hidden="true" />
                IPI <span className="text-small font-normal text-txt-2">(federal)</span>
              </span>
              <span className="font-mono text-mono text-txt">
                {ipi && ipi.valor > 0 ? formatBRL(ipi.valor) : 'sem isenção'}
              </span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-bg-alt" aria-hidden="true">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                style={{
                  width: `${barWidth(ipi?.valor ?? 0, maxValor)}%`,
                  transformOrigin: 'left',
                }}
                transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="mt-1">
              <TrustBadge level="official" suffix="regra federal única" />
            </div>
          </li>

          {/* ICMS */}
          <li>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-body font-bold">
                <MapPinned className="h-5 w-5 text-accent" aria-hidden="true" />
                ICMS <span className="text-small font-normal text-txt-2">({uf})</span>
              </span>
              <span className="font-mono text-mono text-txt">
                {icms?.tipo === 'verificar'
                  ? 'a confirmar'
                  : icms && icms.valor !== null && icms.valor > 0
                    ? formatBRL(icms.valor) +
                      (icms.tipo === 'parcial' ? ' (parcial)' : '')
                    : 'sem isenção'}
              </span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-bg-alt" aria-hidden="true">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                style={{
                  width: `${barWidth(icms?.valor ?? 0, maxValor)}%`,
                  transformOrigin: 'left',
                }}
                transition={{
                  duration: reduced ? 0 : 0.5,
                  delay: reduced ? 0 : 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
            <div className="mt-1">
              <TrustBadge level={toTrustLevel(ufRule.icms.confidence)} />
            </div>
          </li>

          {/* IPVA 1º ano */}
          <li>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-body font-bold">
                <CalendarClock className="h-5 w-5 text-accent" aria-hidden="true" />
                IPVA <span className="text-small font-normal text-txt-2">(1º ano, {uf})</span>
              </span>
              <span className="font-mono text-mono text-txt">
                {ipva?.percentualIsencao === 1 && 'isenção total'}
                {ipva?.percentualIsencao === 0.6 && 'redução de 60%'}
                {ipva?.percentualIsencao === 0 && 'sem isenção'}
                {ipva?.percentualIsencao === null && `a confirmar com a SEFAZ-${uf}`}
                {ipva?.percentualIsencao !== null &&
                  ipva?.percentualIsencao !== undefined &&
                  ipva.percentualIsencao > 0 &&
                  ipva.percentualIsencao < 1 &&
                  ipva.percentualIsencao !== 0.6 &&
                  `isenção parcial (~${Math.round(ipva.percentualIsencao * 100)}%)`}
              </span>
            </div>
            <p className="mt-1 text-small text-txt-2">{ipva?.disclaimer}</p>
            <div className="mt-1">
              <TrustBadge level={toTrustLevel(ufRule.ipva.confidence)} />
            </div>
          </li>
        </ul>
      )}

      {/* Faixas de regra aplicadas */}
      {faixas.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Faixas de regra aplicadas">
          {faixas.map((f) => (
            <li
              key={f.label}
              className={cn(
                'rounded-full border px-3 py-1 font-mono text-mono',
                f.ok ? 'border-success/40 text-success' : 'border-danger/40 text-danger',
              )}
            >
              {f.ok ? '✓' : '✗'} {f.label}
            </li>
          ))}
        </ul>
      )}

      {/* Nota honesta — warnings da UF */}
      {result && hasWarning && (
        <div
          className="rounded-input border border-danger/50 bg-bg-alt p-4"
          role="note"
          aria-label="Pontos de atenção do seu estado"
        >
          <p className="flex items-center gap-2 text-small font-bold text-danger">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Pontos de atenção em {uf}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-txt-2">
            {result.warnings
              .filter((w) => !w.startsWith('Estimativa com base'))
              .map((w) => (
                <li key={w}>{w}</li>
              ))}
          </ul>
        </div>
      )}

      {/* Mini linha do tempo regulatória */}
      <div className="rounded-input border border-line bg-bg-alt p-4">
        <p className="text-small font-bold">Linha do tempo das regras</p>
        <div className="mt-2 flex items-center gap-2 font-mono text-mono text-txt-2" aria-hidden="true">
          <span>Hoje</span>
          <span className="relative h-1 flex-1 rounded-full bg-line">
            <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-accent" />
          </span>
          <span>31/12/2026</span>
        </div>
        <p className="mt-2 text-small text-txt-2">
          As regras atuais valem até 31/12/2026; 2027 traz regras novas.{' '}
          <Link to="/guia" className="text-accent underline underline-offset-2">
            Entenda no guia
          </Link>
          .
        </p>
      </div>

      {/* Microcopy legal + CTAs */}
      <p className="text-small text-txt-2">
        Estimativa educativa com base nas regras vigentes. O deferimento e o valor final dependem
        do órgão público e do seu caso.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onOpenLead}
          className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-btn bg-accent px-6 font-bold text-on-accent transition-all hover:bg-accent-hover hover:shadow-amber-glow active:scale-[0.98]"
        >
          Receber meu mapa completo de {uf} grátis
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-whatsapp-dark px-6 font-medium text-white transition-colors hover:brightness-110 active:scale-[0.98]"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Tirar dúvidas no WhatsApp
        </a>
      </div>
    </div>
  )
}

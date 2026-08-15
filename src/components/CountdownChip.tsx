import { useEffect, useState } from 'react'
import { REGIME_DEADLINE } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, REGIME_DEADLINE.getTime() - Date.now())
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  }
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

interface CountdownChipProps {
  /** Tamanho grande (hero/CTA final) ou compacto (inline). */
  size?: 'lg' | 'sm'
  /** Frase de contexto textual (sempre presente — a11y). */
  context?: string
  className?: string
}

/**
 * Countdown regulatório até 31/12/2026 (design.md §8.5).
 * Números em IBM Plex Mono tabulares; continua atualizando com
 * prefers-reduced-motion (é informação, não decoração).
 */
export default function CountdownChip({
  size = 'lg',
  context = 'As regras atuais valem até 31/12/2026. Quem começar agora trava o regime vigente.',
  className,
}: CountdownChipProps) {
  const [t, setT] = useState<TimeLeft>(getTimeLeft)

  useEffect(() => {
    const id = window.setInterval(() => setT(getTimeLeft()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const segments: Array<{ value: string; label: string }> = [
    { value: pad(t.days, 3), label: 'dias' },
    { value: pad(t.hours), label: 'h' },
    { value: pad(t.minutes), label: 'min' },
    { value: pad(t.seconds), label: 's' },
  ]

  const liveText = `Faltam ${t.days} dias, ${t.hours} horas, ${t.minutes} minutos e ${t.seconds} segundos para 31 de dezembro de 2026.`

  if (size === 'sm') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-accent/40 bg-surface px-4 py-2',
          className,
        )}
      >
        <span className="sr-only">{liveText}</span>
        <span aria-hidden="true" className="tnum font-mono text-sm text-accent">
          {pad(t.days, 3)}d : {pad(t.hours)}h : {pad(t.minutes)}m : {pad(t.seconds)}s
        </span>
        <span className="text-small text-txt-2">até 31/12/2026</span>
      </span>
    )
  }

  return (
    <div
      className={cn(
        'rounded-card border border-accent/40 bg-surface p-5 sm:p-6',
        className,
      )}
    >
      <p className="text-small text-txt-2">
        As regras atuais valem até{' '}
        <time dateTime="2026-12-31" className="font-mono font-medium text-accent">
          31/12/2026
        </time>
      </p>
      <p
        role="timer"
        aria-label={liveText}
        className="tnum mt-2 flex items-baseline gap-1 font-mono text-[2rem] font-medium leading-none text-accent sm:gap-2"
      >
        {segments.map((seg, i) => (
          <span key={seg.label} className="flex items-baseline gap-1 sm:gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="text-txt-2">
                :
              </span>
            )}
            <span>
              {seg.value}
              <span className="ml-1 font-sans text-sm font-normal text-txt-2">
                {seg.label}
              </span>
            </span>
          </span>
        ))}
      </p>
      <p className="mt-3 text-small text-txt-2">{context}</p>
    </div>
  )
}

import { useId } from 'react'
import { AlertTriangle } from 'lucide-react'
import { FEDERAL } from '@contracts/constants'
import { formatBRL } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const PRICE_MIN = 50_000
export const PRICE_MAX = 200_000
export const PRICE_STEP = 500

interface PriceSliderProps {
  value: number
  onChange: (v: number) => void
  /** Quando um carro do catálogo está selecionado, o slider acompanha (somente leitura visual). */
  disabled?: boolean
}

/**
 * Slider de preço R$ 50–200 mil com marcas de teto (70 / 120 / 200 mil).
 * Zona acima de R$ 120 mil tem aviso textual + cor (nunca só cor).
 */
export default function PriceSlider({ value, onChange, disabled }: PriceSliderProps) {
  const id = useId()
  const pct = ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
  const aboveIcms = value > FEDERAL.ICMS_CEILING_PARTIAL

  const marks = [
    { v: FEDERAL.ICMS_CEILING_FULL, label: 'R$ 70 mil', hint: 'ICMS total até aqui' },
    { v: FEDERAL.ICMS_CEILING_PARTIAL, label: 'R$ 120 mil', hint: 'ICMS parcial até aqui' },
    { v: FEDERAL.IPI_CEILING, label: 'R$ 200 mil', hint: 'teto IPI' },
  ]

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-small font-bold">
          Preço do carro
        </label>
        <output
          htmlFor={id}
          className="font-mono text-[28px] font-medium leading-none text-accent"
          aria-live="polite"
        >
          {formatBRL(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={PRICE_STEP}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-describedby={`${id}-marcas`}
        className={cn(
          'h-11 w-full cursor-pointer accent-amber-400 disabled:cursor-not-allowed disabled:opacity-60',
          aboveIcms && 'accent-coral-400',
        )}
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--line) ${pct}%, var(--line) 100%)`,
        }}
      />
      <div id={`${id}-marcas`} className="relative mt-1 h-12" aria-hidden="false">
        {marks.map((m) => {
          const left = ((m.v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
          return (
            <div
              key={m.v}
              className="absolute -translate-x-1/2 text-center"
              style={{ left: `${left}%` }}
            >
              <span className="mx-auto block h-2 w-px bg-txt-2" aria-hidden="true" />
              <span className="block font-mono text-xs text-txt">{m.label}</span>
              <span className="block text-xs text-txt-2">{m.hint}</span>
            </div>
          )
        })}
      </div>
      {aboveIcms && (
        <p
          role="status"
          className="mt-2 flex items-start gap-2 rounded-input border border-danger/40 bg-danger/10 px-3 py-2 text-small text-danger"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Acima de R$ 120 mil não há isenção de ICMS — o IPI ainda vale até R$ 200 mil.
        </p>
      )}
    </div>
  )
}

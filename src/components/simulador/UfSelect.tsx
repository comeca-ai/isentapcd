import { useId } from 'react'
import { MapPin } from 'lucide-react'
import { UF_LIST, UF_MATRIX, type Uf } from '@contracts/constants'
import { toTrustLevel } from './helpers'
import TrustBadge from '@/components/TrustBadge'

interface UfSelectProps {
  value: Uf
  onChange: (uf: Uf) => void
}

/**
 * Estado — select nativo buscável por teclado com as 27 UFs (simulador.md SM2.1).
 * Ao trocar, chip mono mostra "Regras de [UF]" + TrustBadge da regra de ICMS do estado.
 */
export default function UfSelect({ value, onChange }: UfSelectProps) {
  const id = useId()
  const rule = UF_MATRIX[value]

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-small font-bold">
        Estado onde o carro será emplacado
      </label>
      <p className="mb-2 text-small text-txt-2">
        As regras de ICMS e IPVA mudam de estado para estado.
      </p>
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-txt-2"
          aria-hidden="true"
        />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as Uf)}
          className="h-[52px] w-full appearance-none rounded-input border-[1.5px] border-line bg-surface pl-10 pr-4 text-body text-txt outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
        >
          {UF_LIST.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-mono text-txt-2">
        <span>Regras de {value}</span>
        <TrustBadge level={toTrustLevel(rule.icms.confidence)} />
      </p>
    </div>
  )
}

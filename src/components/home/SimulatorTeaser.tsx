import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import TrustBadge from '@/components/TrustBadge'
import { UFS, formatBRL } from '@/lib/constants'

/**
 * S5 — Simulador embutido (teaser do /simulador).
 *
 * CÁLCULO PROVISÓRIO client-side via constantes aproximadas —
 * um agente posterior conectará ao tRPC com as regras reais por UF.
 * TODO(tRPC): substituir ICMS_RATES/IPVA_RATES e as faixas de teto
 * pelo endpoint oficial do simulador.
 */

// Alíquotas ICMS aproximadas por UF (%) — provisório
const ICMS_RATES: Record<string, number> = {
  AC: 17, AL: 19, AP: 18, AM: 18, BA: 19, CE: 18, DF: 18, ES: 17, GO: 17,
  MA: 18, MT: 17, MS: 17, MG: 18, PA: 17, PB: 18, PR: 18, PE: 18, PI: 18,
  RJ: 18, RN: 18, RS: 17, RO: 17.5, RR: 17, SC: 17, SP: 18, SE: 19, TO: 18,
}
// Alíquotas IPVA aproximadas por UF (%) — provisório
const IPVA_RATES: Record<string, number> = {
  AC: 2, AL: 2.75, AP: 3, AM: 3, BA: 2.5, CE: 3, DF: 3.5, ES: 2, GO: 3.75,
  MA: 2.5, MT: 3, MS: 3, MG: 4, PA: 2.5, PB: 2.5, PR: 3.5, PE: 3, PI: 2.5,
  RJ: 4, RN: 3, RS: 3, RO: 3, RR: 3, SC: 2, SP: 4, SE: 2.5, TO: 3,
}
const IPI_RATE = 0.08 // alíquota típica efetiva — provisório
const IPI_TETO = 200_000
const ICMS_TETO_TOTAL = 70_000
const ICMS_TETO_PARCIAL = 120_000

const FEATURED_CARS = [
  { name: 'Hatch Compacto 1.0', price: 72_000, img: '/sim-car-hatch.png' },
  { name: 'Hatch City 1.6', price: 84_000, img: '/sim-car-hatch.png' },
  { name: 'Sedã Conforto 1.6', price: 98_000, img: '/sim-car-sedan.png' },
  { name: 'SUV Compacto 1.0T', price: 105_000, img: '/sim-car-suv.png' },
  { name: 'SUV Família 1.4T', price: 119_000, img: '/sim-car-suv.png' },
]

interface Breakdown {
  ipi: number
  icms: number
  ipva: number
}

function estimate(uf: string, price: number): Breakdown {
  const ipi = price <= IPI_TETO ? price * IPI_RATE : 0
  const icmsRate = (ICMS_RATES[uf] ?? 17) / 100
  const icms =
    price <= ICMS_TETO_TOTAL
      ? price * icmsRate
      : price <= ICMS_TETO_PARCIAL
        ? price * icmsRate * 0.5 // parcial — provisório
        : 0
  const ipva = price * ((IPVA_RATES[uf] ?? 3) / 100) // 1º ano — provisório
  return { ipi, icms, ipva }
}

export default function SimulatorTeaser() {
  const [uf, setUf] = useState('SP')
  const [perfil, setPerfil] = useState<'condutor' | 'familiar'>('condutor')
  const [price, setPrice] = useState(72_000)

  const breakdown = useMemo(() => estimate(uf, price), [uf, price])
  const total = breakdown.ipi + breakdown.icms + breakdown.ipva
  const maxBar = Math.max(breakdown.ipi, breakdown.icms, breakdown.ipva, 1)
  const fillPct = ((price - 50_000) / (200_000 - 50_000)) * 100

  const rows: Array<{ key: keyof Breakdown; label: string; badge: 'official' | 'check'; value: number }> = [
    { key: 'ipi', label: 'IPI (federal)', badge: 'official', value: breakdown.ipi },
    { key: 'icms', label: `ICMS (${uf})`, badge: 'official', value: breakdown.icms },
    { key: 'ipva', label: `IPVA 1º ano (${uf})`, badge: 'check', value: breakdown.ipva },
  ]

  const simUrl = `/simulador?uf=${uf}&perfil=${perfil}&preco=${price}`

  return (
    <section aria-labelledby="simulador-title" className="bg-bg-alt">
      <div className="mx-auto max-w-wide px-6 py-24 lg:px-10">
        <h2 id="simulador-title" className="text-center text-h2 font-medium">
          Quanto dá para economizar no seu estado?
        </h2>

        <div className="mx-auto mt-12 grid max-w-[1080px] gap-10 rounded-card border border-line bg-surface p-6 sm:p-10 lg:grid-cols-2">
          {/* Controles */}
          <div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="sim-uf" className="block text-small font-medium text-txt">
                  Estado
                </label>
                <select
                  id="sim-uf"
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  className="mt-2 h-[52px] w-full rounded-input border border-line bg-bg px-4 text-body text-txt"
                >
                  {UFS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sim-perfil" className="block text-small font-medium text-txt">
                  Perfil
                </label>
                <select
                  id="sim-perfil"
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value as 'condutor' | 'familiar')}
                  className="mt-2 h-[52px] w-full rounded-input border border-line bg-bg px-4 text-body text-txt"
                >
                  <option value="condutor">Eu dirijo</option>
                  <option value="familiar">Compro para alguém que não dirige</option>
                </select>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-baseline justify-between">
                <label htmlFor="sim-preco" className="text-small font-medium text-txt">
                  Preço do carro
                </label>
                <output
                  htmlFor="sim-preco"
                  className="tnum font-mono text-xl font-medium text-accent"
                >
                  {formatBRL(price)}
                </output>
              </div>
              <input
                id="sim-preco"
                type="range"
                min={50_000}
                max={200_000}
                step={1_000}
                value={price}
                aria-valuetext={formatBRL(price)}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="sim-slider mt-4 w-full"
                style={{ ['--fill' as string]: `${fillPct}%` }}
              />
              <div className="mt-2 flex justify-between font-mono text-xs text-txt-2">
                <span>R$ 50 mil</span>
                <span>R$ 200 mil</span>
              </div>
            </div>

            <AnimatePresence>
              {price > ICMS_TETO_PARCIAL && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-5 flex items-start gap-2 rounded-input border border-danger/50 bg-danger/10 p-3 text-small text-danger"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Acima de R$ 120 mil o ICMS deixa de ter isenção — o IPI continua até R$ 200 mil.
                </motion.p>
              )}
            </AnimatePresence>

            {/* Carros em destaque */}
            <p className="mt-8 text-small font-medium text-txt" id="sim-cars-label">
              Ou escolha um destaque do catálogo:
            </p>
            <ul
              aria-labelledby="sim-cars-label"
              className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2"
            >
              {FEATURED_CARS.map((car) => (
                <li key={car.name} className="shrink-0 snap-start">
                  <button
                    type="button"
                    onClick={() => setPrice(car.price)}
                    aria-pressed={price === car.price}
                    className={`w-36 cursor-pointer rounded-input border p-2 text-left transition-all hover:-translate-y-0.5 ${
                      price === car.price ? 'border-accent shadow-amber-glow' : 'border-line bg-bg hover:border-accent/40'
                    }`}
                  >
                    <img
                      src={car.img}
                      alt={`Ilustração de ${car.name.toLowerCase()} genérico`}
                      width={240}
                      height={135}
                      className="h-16 w-full rounded-md object-cover"
                      loading="lazy"
                    />
                    <span className="mt-2 block text-xs font-medium text-txt">{car.name}</span>
                    <span className="tnum block font-mono text-xs text-txt-2">
                      {formatBRL(car.price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resultado ao vivo */}
          <div className="flex flex-col justify-center rounded-card border border-line bg-bg p-6 sm:p-8">
            <div aria-live="polite">
              <p className="text-small text-txt-2">Economia estimada no seu caso</p>
              <motion.p
                key={Math.round(total)}
                initial={{ opacity: 0.4, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="tnum mt-2 font-mono text-4xl font-semibold text-accent sm:text-5xl"
              >
                ≈ {formatBRL(total)}
              </motion.p>

              <div className="mt-8 space-y-5">
                {rows.map((row, i) => (
                  <div key={row.key}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-small text-txt">{row.label}</span>
                      <span className="tnum font-mono text-small text-txt">
                        {formatBRL(row.value)}
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-3 overflow-hidden rounded-full bg-line"
                      role="img"
                      aria-label={`${row.label}: ${formatBRL(row.value)}`}
                    >
                      <motion.div
                        className="h-full origin-left rounded-full bg-accent"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 120, damping: 20 }}
                        style={{ width: `${Math.max(2, (row.value / maxBar) * 100)}%` }}
                        layout={undefined}
                      />
                    </div>
                    <TrustBadge level={row.badge} className="mt-1.5" />
                  </div>
                ))}
              </div>

              <p className="mt-6 text-small text-txt-2">
                Estimativa com base nas regras vigentes. O valor exato depende do seu caso e do órgão.
              </p>
            </div>

            <Link
              to={simUrl}
              className="mt-8 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-accent px-6 font-bold text-on-accent transition-all hover:bg-accent-hover hover:shadow-amber-glow active:scale-[0.98]"
            >
              Ver simulação completa e receber meu mapa
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

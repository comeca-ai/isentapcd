import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Trophy } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import type { Uf } from '@contracts/constants'
import { formatBRL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CatalogVehicle } from './CarCatalog'

interface CompareTableProps {
  vehicles: CatalogVehicle[]
  uf: Uf
  isDriver: boolean
}

interface RowData {
  vehicle: CatalogVehicle
  ipi: number
  icms: number | null
  ipvaTexto: string
  total: number | null
}

function ipvaTextoDe(percentual: number | null, uf: Uf): string {
  if (percentual === 1) return 'Isenção total'
  if (percentual === 0.6) return 'Redução de 60%'
  if (percentual === 0) return 'Sem isenção'
  if (percentual !== null && percentual > 0) return `Parcial (~${Math.round(percentual * 100)}%)`
  return `A confirmar (SEFAZ-${uf})`
}

/** Uma linha do comparador — cada carro tem sua própria query de cálculo real. */
function useCompareRow(vehicle: CatalogVehicle, uf: Uf, isDriver: boolean): RowData {
  const q = trpc.simulator.calculate.useQuery(
    { vehicleId: vehicle.id, uf, isDriver },
    { staleTime: 60_000 },
  )
  const r = q.data
  return {
    vehicle,
    ipi: r?.breakdown.ipi.valor ?? 0,
    icms: r?.breakdown.icms.valor ?? null,
    ipvaTexto: r ? ipvaTextoDe(r.breakdown.ipva.percentualIsencao, uf) : '…',
    total: r?.breakdown.total ?? null,
  }
}

/**
 * Comparador de até 3 cenários (simulador.md SM3) — tabela acessível com
 * <caption> e cabeçalhos scope + toggle "Ver como barras" (recharts).
 */
export default function CompareTable({ vehicles, uf, isDriver }: CompareTableProps) {
  const [view, setView] = useState<'tabela' | 'barras'>('tabela')
  // Hooks estáveis: o comparador aceita no máximo 3 carros (SM3)
  const row0 = useCompareRow(vehicles[0], uf, isDriver)
  const row1 = useCompareRow(vehicles[1] ?? vehicles[0], uf, isDriver)
  const row2 = useCompareRow(vehicles[2] ?? vehicles[1] ?? vehicles[0], uf, isDriver)
  const rows = [row0, row1, row2].slice(0, vehicles.length)

  const best = rows.reduce<number | null>((acc, r, i) => {
    if (r.total === null) return acc
    if (acc === null || (rows[acc].total ?? -1) < r.total) return i
    return acc
  }, null)

  const chartData = rows.map((r) => ({
    nome: r.vehicle.nome,
    IPI: Math.round(r.ipi),
    ICMS: Math.round(r.icms ?? 0),
  }))

  return (
    <section aria-labelledby="comparador-titulo" className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="comparador-titulo" className="font-display text-h2 font-medium">
          Compare lado a lado
        </h2>
        <div
          role="group"
          aria-label="Forma de visualização da comparação"
          className="flex rounded-full border border-line p-1"
        >
          {(
            [
              { id: 'tabela', label: 'Ver como tabela' },
              { id: 'barras', label: 'Ver como barras' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setView(opt.id)}
              aria-pressed={view === opt.id}
              className={cn(
                'min-h-[44px] rounded-full px-4 text-small font-medium transition-colors',
                view === opt.id ? 'bg-accent text-on-accent' : 'text-txt-2 hover:text-txt',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'tabela' ? (
        <div className="mt-6 overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">
              Comparação de economia estimada entre os carros selecionados em {uf}: IPI, ICMS,
              IPVA do primeiro ano, total economizado e percentual do preço.
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface">
                <th scope="col" className="px-4 py-3 text-small font-bold">
                  Modelo
                </th>
                <th scope="col" className="px-4 py-3 text-small font-bold">
                  Preço
                </th>
                <th scope="col" className="px-4 py-3 text-small font-bold">
                  IPI
                </th>
                <th scope="col" className="px-4 py-3 text-small font-bold">
                  ICMS
                </th>
                <th scope="col" className="px-4 py-3 text-small font-bold">
                  IPVA 1º ano
                </th>
                <th scope="col" className="px-4 py-3 text-small font-bold">
                  Total economizado
                </th>
                <th scope="col" className="px-4 py-3 text-small font-bold">
                  % do preço
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isBest = best === i
                const pct = r.total !== null ? Math.round((r.total / r.vehicle.preco) * 100) : null
                return (
                  <tr
                    key={r.vehicle.id}
                    className={cn(
                      'border-b border-line last:border-0',
                      i % 2 === 0 ? 'bg-surface' : 'bg-bg-alt',
                      isBest && 'outline-2 outline-accent'
                    )}
                  >
                    <th scope="row" className="px-4 py-3">
                      <span className="flex flex-wrap items-center gap-2 text-small font-bold">
                        {r.vehicle.nome}
                        {isBest && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 font-mono text-xs text-on-accent">
                            <Trophy className="h-3 w-3" aria-hidden="true" />
                            melhor economia
                          </span>
                        )}
                      </span>
                    </th>
                    <td className="px-4 py-3 font-mono text-mono">{formatBRL(r.vehicle.preco)}</td>
                    <td className="px-4 py-3 font-mono text-mono">{formatBRL(r.ipi)}</td>
                    <td className="px-4 py-3 font-mono text-mono">
                      {r.icms === null ? 'a confirmar' : formatBRL(r.icms)}
                    </td>
                    <td className="px-4 py-3 text-small">{r.ipvaTexto}</td>
                    <td className="px-4 py-3 font-mono text-mono font-semibold text-accent">
                      {r.total === null ? '—' : formatBRL(r.total)}
                    </td>
                    <td className="px-4 py-3 font-mono text-mono">
                      {pct === null ? '—' : `${pct}%`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="mt-6 rounded-card border border-line bg-surface p-4"
          role="img"
          aria-label={`Gráfico de barras com IPI e ICMS estimados para ${rows
            .map((r) => r.vehicle.nome)
            .join(', ')}`}
        >
          <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 72)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
              <XAxis
                type="number"
                tickFormatter={(v: number) => `R$ ${Math.round(v / 1000)} mil`}
                stroke="var(--text-2)"
                fontSize={13}
              />
              <YAxis
                type="category"
                dataKey="nome"
                width={180}
                stroke="var(--text-2)"
                fontSize={13}
              />
              <Tooltip
                formatter={(value) => formatBRL(Number(value))}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  color: 'var(--text)',
                }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Bar dataKey="IPI" stackId="a" fill="var(--accent)" />
              <Bar dataKey="ICMS" stackId="a" fill="var(--success)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

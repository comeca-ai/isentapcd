import { Check, GitCompareArrows, SlidersHorizontal } from 'lucide-react'
import { FUEL_LABELS, type FuelType } from '@contracts/constants'
import { formatBRL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { hueForSlug } from './helpers'

/** Veículo conforme devolvido por trpc.vehicles.list (preco em R$). */
export interface CatalogVehicle {
  id: number
  slug: string
  nome: string
  categoria: string
  preco: number
  combustivel: FuelType
  adaptacao: boolean
  imagem: string
}

interface CarCatalogProps {
  vehicles: CatalogVehicle[]
  loading: boolean
  selectedId: number | null
  /** null + customMode = slider personalizado ativo */
  customMode: boolean
  onSelect: (v: CatalogVehicle) => void
  onSelectCustom: () => void
  compareIds: number[]
  onToggleCompare: (id: number) => void
}

const HUE_BY_CATEGORY: Record<string, number> = { hatch: 0, sedan: 140, suv: 260 }

/**
 * Catálogo de carros elegíveis (simulador.md SM2.3) — grid 2 colunas de
 * mini-cards, imagem base com cor via filtro CSS, seleção com borda âmbar +
 * check, checkbox "comparar" para o comparador de cenários (SM3).
 */
export default function CarCatalog({
  vehicles,
  loading,
  selectedId,
  customMode,
  onSelect,
  onSelectCustom,
  compareIds,
  onToggleCompare,
}: CarCatalogProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Carregando catálogo">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-card border border-line bg-bg-alt" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <p id="catalogo-label" className="mb-2 text-small font-bold">
        Carros elegíveis{' '}
        <span className="font-normal text-txt-2">(modelos genéricos, sem marca)</span>
      </p>
      <ul aria-labelledby="catalogo-label" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {vehicles.map((v) => {
          const selected = !customMode && selectedId === v.id
          const comparing = compareIds.includes(v.id)
          const compareFull = !comparing && compareIds.length >= 3
          const hue = (HUE_BY_CATEGORY[v.categoria] ?? 0) + (hueForSlug(v.slug) % 40) - 20
          return (
            <li key={v.id} className="relative">
              <button
                type="button"
                onClick={() => onSelect(v)}
                aria-pressed={selected}
                className={cn(
                  'group flex min-h-[64px] w-full cursor-pointer flex-col gap-1 rounded-card border-2 bg-bg-alt p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40',
                  selected ? 'border-accent bg-surface' : 'border-line',
                )}
              >
                {selected && (
                  <span
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-accent"
                    aria-hidden="true"
                  >
                    <Check className="h-4 w-4" />
                  </span>
                )}
                <img
                  src={v.imagem}
                  alt=""
                  loading="lazy"
                  width={240}
                  height={135}
                  className={cn(
                    'h-20 w-full rounded-input object-cover transition-transform duration-200',
                    selected && 'translate-x-1',
                  )}
                  style={{ filter: `hue-rotate(${hue}deg)` }}
                />
                <span className="text-small font-bold leading-tight text-txt">{v.nome}</span>
                <span className="flex flex-wrap items-center gap-x-2 font-mono text-mono text-txt-2">
                  <span className="text-txt">{formatBRL(v.preco)}</span>
                  <span>{FUEL_LABELS[v.combustivel]}</span>
                  {v.adaptacao && <span>· adaptado</span>}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onToggleCompare(v.id)}
                aria-pressed={comparing}
                disabled={compareFull}
                aria-label={
                  comparing
                    ? `Remover ${v.nome} da comparação`
                    : `Comparar ${v.nome} com outros carros`
                }
                title={compareFull ? 'Máximo de 3 carros na comparação' : undefined}
                className={cn(
                  'absolute bottom-2 right-2 inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors',
                  comparing
                    ? 'border-accent bg-accent text-on-accent'
                    : 'border-line bg-surface text-txt-2 hover:border-accent/50 hover:text-txt',
                  compareFull && 'cursor-not-allowed opacity-40',
                )}
              >
                <GitCompareArrows className="h-5 w-5" aria-hidden="true" />
              </button>
            </li>
          )
        })}
        {/* Chip "Personalizado" — ativa o slider sem carro */}
        <li>
          <button
            type="button"
            onClick={onSelectCustom}
            aria-pressed={customMode}
            className={cn(
              'flex min-h-[64px] w-full cursor-pointer items-center justify-center gap-2 rounded-card border-2 border-dashed p-3 text-small font-bold transition-colors',
              customMode
                ? 'border-accent bg-surface text-accent'
                : 'border-line text-txt-2 hover:border-accent/40 hover:text-txt',
            )}
          >
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            Personalizado — arraste o preço
          </button>
        </li>
      </ul>
    </div>
  )
}

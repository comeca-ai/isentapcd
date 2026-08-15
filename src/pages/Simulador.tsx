import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowUp, RotateCcw } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { UF_LIST, type Uf } from '@contracts/constants'
import { formatBRL } from '@/lib/constants'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import UfSelect from '@/components/simulador/UfSelect'
import PriceSlider from '@/components/simulador/PriceSlider'
import CarCatalog, { type CatalogVehicle } from '@/components/simulador/CarCatalog'
import ResultPanel from '@/components/simulador/ResultPanel'
import CompareTable from '@/components/simulador/CompareTable'
import LeadModal from '@/components/simulador/LeadModal'
import { loadContact } from '@/components/simulador/helpers'

const EXIT_KEY = 'isentapcd:lead-exit-shown'

const TESTIMONIALS = [
  {
    img: '/testimonial-1.png',
    quote: 'O simulador me mostrou R$ 11 mil de economia antes de eu pisar na concessionária.',
    author: 'Renata, mãe do Theo (TEA) — SP',
  },
  {
    img: '/testimonial-2.png',
    quote: 'O mapa do meu estado tinha até o portal certo da Sefaz. Economia de semanas.',
    author: 'Carlos, condutor PCD — PR',
  },
  {
    img: '/testimonial-3.png',
    quote: 'Descobri que minha mãe podia pedir mesmo sem dirigir. Ninguém tinha contado isso.',
    author: 'Juliana, filha e responsável — MG',
  },
]

const FAQ = [
  {
    q: 'O simulador é oficial?',
    a: 'Não — é educativo. Ele aplica as regras publicadas (Lei 8.989/95, Convênio ICMS 38/2012 e leis estaduais) ao preço que você informou. Quem confirma o benefício e o valor final é sempre o órgão público.',
  },
  {
    q: 'O valor sai exato na concessionária?',
    a: 'Quase nunca. A nota fiscal pode variar com opções, frete e itens de série — e cada imposto tem sua base de cálculo. Use o número como referência honesta de ordem de grandeza, não como boleto.',
  },
  {
    q: 'E acima de R$ 120 mil?',
    a: 'O IPI federal continua isento até R$ 200 mil, mas o ICMS zera acima de R$ 120 mil na maioria dos estados (a isenção cobre só a parcela de R$ 70 mil entre 70 e 120 mil). O simulador mostra isso linha a linha.',
  },
  {
    q: 'Posso simular para outro estado?',
    a: 'Sim — troque o estado no campo acima e compare. As regras de ICMS e IPVA mudam bastante de UF para UF; o selo de confiança em cada linha mostra o que está confirmado na fonte oficial.',
  },
]

/**
 * /simulador — Simulador de economia (simulador.md). Cálculo REAL via
 * trpc.simulator.calculate; catálogo via trpc.vehicles.list; deep-link
 * ?carro=slug&uf=SP&perfil=condutor&preco=85000; modal de lead com 3 gatilhos.
 */
export default function Simulador() {
  const reduced = useReducedMotion()
  const [params, setParams] = useSearchParams()

  // ── Estado do painel ─────────────────────────────────────────────────────
  const [uf, setUf] = useState<Uf>(() => {
    const p = params.get('uf')
    return p && (UF_LIST as readonly string[]).includes(p) ? (p as Uf) : 'SP'
  })
  const [isDriver, setIsDriver] = useState(() => params.get('perfil') !== 'responsavel')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [customMode, setCustomMode] = useState(false)
  const [preco, setPreco] = useState(() => {
    const p = Number(params.get('preco'))
    return Number.isFinite(p) && p >= 50_000 && p <= 200_000 ? p : 85_000
  })
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [leadDone, setLeadDone] = useState(() => loadContact() !== null)
  const interactedRef = useRef(false)
  const markInteracted = useCallback(() => {
    interactedRef.current = true
  }, [])

  // ── Dados ────────────────────────────────────────────────────────────────
  const vehiclesQ = trpc.vehicles.list.useQuery(undefined, { staleTime: 300_000 })
  const vehicles = useMemo(
    () => (vehiclesQ.data ?? []) as CatalogVehicle[],
    [vehiclesQ.data],
  )

  // Deep-link ?carro=slug — pré-seleciona quando o catálogo chega
  const carroParam = params.get('carro')
  useEffect(() => {
    if (!carroParam || vehicles.length === 0 || selectedId !== null) return
    const found = vehicles.find((v) => v.slug === carroParam)
    if (found) {
      setSelectedId(found.id)
      setPreco(found.preco)
      setCustomMode(false)
    } else {
      // slug desconhecido: cai no modo personalizado
      setCustomMode(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carroParam, vehicles])

  // Se nada veio por deep-link, seleciona o primeiro do catálogo
  useEffect(() => {
    if (selectedId === null && !customMode && vehicles.length > 0 && !carroParam) {
      setSelectedId(vehicles[0].id)
      setPreco(vehicles[0].preco)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles])

  // Se a URL já tinha ?preco= sem ?carro=, começa no modo personalizado
  useEffect(() => {
    if (params.get('preco') && !params.get('carro')) setCustomMode(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedId) ?? null,
    [vehicles, selectedId],
  )

  const calcInput = useMemo(
    () =>
      !customMode && selectedId !== null
        ? { vehicleId: selectedId, uf, isDriver }
        : { preco, uf, combustivel: 'flex' as const, isDriver },
    [customMode, selectedId, uf, isDriver, preco],
  )
  const calcQ = trpc.simulator.calculate.useQuery(calcInput, {
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  // ── Gatilhos do modal (simulador.md SM4) ─────────────────────────────────
  const modalOpenRef = useRef(modalOpen)
  modalOpenRef.current = modalOpen

  // Gatilho 2: exit-intent (desktop, uma vez por sessão)
  useEffect(() => {
    if (leadDone) return
    const fine = window.matchMedia('(pointer: fine)').matches
    if (!fine) return
    function onMouseOut(e: MouseEvent) {
      if (e.clientY > 4) return
      if (!interactedRef.current || modalOpenRef.current) return
      if (sessionStorage.getItem(EXIT_KEY)) return
      sessionStorage.setItem(EXIT_KEY, '1')
      setModalOpen(true)
    }
    document.addEventListener('mouseout', onMouseOut)
    return () => document.removeEventListener('mouseout', onMouseOut)
  }, [leadDone])

  // Gatilho 3: 45s de permanência com interação no simulador
  useEffect(() => {
    if (leadDone) return
    const t = window.setTimeout(() => {
      if (interactedRef.current && !modalOpenRef.current && !sessionStorage.getItem(EXIT_KEY)) {
        sessionStorage.setItem(EXIT_KEY, '1')
        setModalOpen(true)
      }
    }, 45_000)
    return () => window.clearTimeout(t)
  }, [leadDone])

  // SEO (simulador.md)
  useEffect(() => {
    document.title = 'Simulador de isenção PCD — quanto você economiza no carro 0 km | IsentaPCD'
    return () => {
      document.title = 'IsentaPCD'
    }
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleSelect(v: CatalogVehicle) {
    markInteracted()
    setSelectedId(v.id)
    setCustomMode(false)
    setPreco(v.preco)
  }
  function handleCustom() {
    markInteracted()
    setCustomMode(true)
    setSelectedId(null)
  }
  function handleToggleCompare(id: number) {
    markInteracted()
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id],
    )
  }
  function handleClear() {
    setUf('SP')
    setIsDriver(true)
    setCustomMode(false)
    setPreco(85_000)
    setCompareIds([])
    setSelectedId(vehicles[0]?.id ?? null)
    if (vehicles[0]) setPreco(vehicles[0].preco)
    setParams({}, { replace: true })
  }

  const total = calcQ.data?.breakdown.total ?? null

  return (
    <div className="bg-bg text-txt">
      {/* SM1 — Cabeçalho */}
      <section className="mx-auto max-w-content px-6 pt-16 lg:px-10 lg:pt-24">
        <p className="font-mono text-mono font-medium uppercase tracking-wider text-accent">
          Simulador grátis · Regras 2026
        </p>
        <h1 className="mt-3 max-w-[20ch] font-display text-h1 font-medium [text-wrap:balance]">
          {['Faça', 'as', 'contas', 'do', 'seu', 'carro', 'isento.'].map((w, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              {w}
              {i < 6 ? ' ' : ''}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="mt-4 max-w-prose68 text-lead text-txt-2"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          Escolha o estado, o perfil e o carro (ou arraste o preço). Mostramos a economia
          estimada imposto por imposto — com as fontes.
        </motion.p>
      </section>

      {/* SM2 — Painel do simulador */}
      <section className="mx-auto max-w-content px-6 py-12 lg:px-10">
        <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[5fr_7fr]">
            {/* Controles */}
            <div className="flex flex-col gap-8">
              <UfSelect
                value={uf}
                onChange={(u) => {
                  markInteracted()
                  setUf(u)
                }}
              />

              {/* Perfil — segmented control */}
              <div>
                <p id="perfil-label" className="mb-2 text-small font-bold">
                  Quem vai dirigir?
                </p>
                <div
                  role="group"
                  aria-labelledby="perfil-label"
                  className="grid grid-cols-2 gap-1 rounded-btn border border-line bg-bg-alt p-1"
                >
                  {(
                    [
                      { v: true, label: 'Eu vou dirigir' },
                      { v: false, label: 'Compro para quem não dirige' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      aria-pressed={isDriver === opt.v}
                      onClick={() => {
                        markInteracted()
                        setIsDriver(opt.v)
                      }}
                      className={cn(
                        'min-h-[48px] rounded-[10px] px-3 text-small font-bold transition-colors',
                        isDriver === opt.v
                          ? 'bg-accent text-on-accent'
                          : 'text-txt-2 hover:text-txt',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-small text-txt-2">
                  {isDriver
                    ? 'Você compra no seu nome e dirige o carro.'
                    : 'O carro fica no nome da pessoa com deficiência e você indica até 3 condutores autorizados.'}
                </p>
              </div>

              <CarCatalog
                vehicles={vehicles}
                loading={vehiclesQ.isLoading}
                selectedId={selectedId}
                customMode={customMode}
                onSelect={handleSelect}
                onSelectCustom={handleCustom}
                compareIds={compareIds}
                onToggleCompare={handleToggleCompare}
              />

              <PriceSlider
                value={preco}
                disabled={!customMode && selectedId !== null}
                onChange={(v) => {
                  markInteracted()
                  setPreco(v)
                  if (!customMode) setCustomMode(true)
                  if (customMode || selectedId === null) setSelectedId(null)
                }}
              />
              {!customMode && selectedId !== null && (
                <p className="-mt-4 text-small text-txt-2">
                  O preço segue o carro selecionado. Toque em “Personalizado” (ou arraste) para
                  simular qualquer valor.
                </p>
              )}

              <button
                type="button"
                onClick={handleClear}
                className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-btn border border-line px-4 text-small font-medium text-txt-2 transition-colors hover:border-accent/50 hover:text-txt"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Limpar simulação
              </button>
            </div>

            {/* Resultado */}
            <div id="resultado" className="scroll-mt-24 lg:border-l lg:border-line lg:pl-10">
              {calcQ.isError ? (
                <p role="alert" className="text-body text-danger">
                  Não foi possível calcular agora. Tente novamente em instantes.
                </p>
              ) : (
                <ResultPanel
                  result={calcQ.data}
                  isFetching={calcQ.isFetching}
                  uf={uf}
                  isDriver={isDriver}
                  vehicleName={customMode ? null : (selectedVehicle?.nome ?? null)}
                  onOpenLead={() => {
                    markInteracted()
                    setModalOpen(true)
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Bottom-sheet mobile: ver economia */}
        <a
          href="#resultado"
          className="fixed bottom-4 left-4 right-24 z-40 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-accent px-6 font-bold text-on-accent shadow-amber-glow lg:hidden"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
          Ver economia{total !== null ? `: ≈ ${formatBRL(total)}` : ''}
        </a>

        {/* SM3 — Comparador */}
        {compareIds.length >= 2 && (
          <CompareTable
            vehicles={compareIds
              .map((id) => vehicles.find((v) => v.id === id))
              .filter((v): v is CatalogVehicle => Boolean(v))}
            uf={uf}
            isDriver={isDriver}
          />
        )}
        {compareIds.length === 1 && (
          <p className="mt-8 text-small text-txt-2" role="status">
            Escolha mais um carro para comparar lado a lado (até 3).
          </p>
        )}
      </section>

      {/* SM5 — Prova social + FAQ curto */}
      <section className="border-t border-line bg-bg-alt">
        <div className="mx-auto max-w-content px-6 py-16 lg:px-10">
          <h2 className="font-display text-h2 font-medium">Quem já simulou</h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <li key={t.author} className="rounded-card border border-line bg-surface p-6">
                <div className="flex items-center gap-3">
                  <img
                    src={t.img}
                    alt=""
                    loading="lazy"
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <p className="text-small font-bold">{t.author}</p>
                </div>
                <blockquote className="mt-3 text-body text-txt-2">“{t.quote}”</blockquote>
              </li>
            ))}
          </ul>

          <h2 className="mt-16 font-display text-h2 font-medium">Perguntas sobre o cálculo</h2>
          <div className="mt-6 grid gap-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-card border border-line bg-surface px-5 py-4 open:border-accent/40"
              >
                <summary className="min-h-[44px] cursor-pointer list-none text-body font-bold text-txt marker:hidden [&::-webkit-details-marker]:hidden">
                  {f.q}
                </summary>
                <p className="mt-2 max-w-prose68 text-body text-txt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* SM4 — Modal de captura de lead */}
      <LeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        uf={uf}
        total={total}
        vehicleSlug={customMode ? null : (selectedVehicle?.slug ?? null)}
        onCaptured={() => setLeadDone(true)}
      />
    </div>
  )
}

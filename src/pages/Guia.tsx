import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Clock, Search } from 'lucide-react'
import TrustBadge from '@/components/TrustBadge'
import UfMap from '@/components/guia/UfMap'
import { CAPITULOS } from '@/components/guia/capitulos'
import { GLOSSARIO_TERMOS } from '@/components/guia/Glossario'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]
const HEADLINE = 'Entenda as isenções como quem explica para um amigo.'

interface Resultado {
  id: string
  tipo: 'Capítulo' | 'Pergunta' | 'Glossário'
  label: string
  detalhe: string
  href: string
  /** Texto extra usado só para casar a busca. */
  busca: string
}

const INDICE: Resultado[] = [
  ...CAPITULOS.map((c) => ({
    id: `cap-${c.slug}`,
    tipo: 'Capítulo' as const,
    label: c.titulo,
    detalhe: c.resumo,
    href: `/guia/${c.slug}`,
    busca: `${c.titulo} ${c.resumo} ${c.keywords.join(' ')}`,
  })),
  ...CAPITULOS.flatMap((c) =>
    c.faq.map((f, i) => ({
      id: `faq-${c.slug}-${i}`,
      tipo: 'Pergunta' as const,
      label: f.q,
      detalhe: `No capítulo "${c.titulo}"`,
      href: `/guia/${c.slug}`,
      busca: `${f.q} ${f.a}`,
    })),
  ),
  ...GLOSSARIO_TERMOS.map((t) => ({
    id: `glo-${t}`,
    tipo: 'Glossário' as const,
    label: t,
    detalhe: 'Termo explicado nos capítulos do guia',
    href: '/guia/requisitos',
    busca: t,
  })),
]

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Barra de busca com resultados instantâneos, navegável por setas. */
function BuscaGuia() {
  const [termo, setTermo] = useState('')
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  const resultados = useMemo(() => {
    const q = normalizar(termo.trim())
    if (q.length < 2) return []
    return INDICE.filter((r) => normalizar(`${r.label} ${r.detalhe} ${r.busca}`).includes(q)).slice(0, 8)
  }, [termo])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function ir(href: string) {
    setAberto(false)
    setTermo('')
    navigate(href)
  }

  return (
    <div ref={rootRef} className="relative mx-auto mt-10 max-w-[640px]">
      <label htmlFor="busca-guia" className="sr-only">
        Buscar no guia
      </label>
      <div className="flex items-center gap-3 rounded-btn border border-line bg-surface px-5 focus-within:border-accent">
        <Search className="h-5 w-5 shrink-0 text-txt-2" aria-hidden="true" />
        <input
          id="busca-guia"
          type="search"
          role="combobox"
          aria-expanded={aberto && resultados.length > 0}
          aria-controls="busca-guia-resultados"
          aria-activedescendant={
            aberto && resultados.length > 0 ? `resultado-${resultados[ativo]?.id}` : undefined
          }
          autoComplete="off"
          placeholder="Busque: 'autismo', 'carência', 'MEI'…"
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value)
            setAberto(true)
            setAtivo(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setAtivo((v) => Math.min(v + 1, resultados.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setAtivo((v) => Math.max(v - 1, 0))
            } else if (e.key === 'Enter' && resultados[ativo]) {
              e.preventDefault()
              ir(resultados[ativo].href)
            } else if (e.key === 'Escape') {
              setAberto(false)
            }
          }}
          className="h-14 w-full bg-transparent text-body text-txt outline-none placeholder:text-txt-2"
        />
      </div>

      {aberto && termo.trim().length >= 2 && (
        <div
          id="busca-guia-resultados"
          role="listbox"
          aria-label="Resultados da busca"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-card border border-line bg-surface shadow-card-light"
        >
          {resultados.length === 0 ? (
            <p className="px-5 py-4 text-small text-txt-2">
              Nada encontrado para "{termo}". Tente "IPI", "carência" ou o nome do seu estado — ou
              pergunte no WhatsApp.
            </p>
          ) : (
            <ul>
              {resultados.map((r, i) => (
                <li key={r.id} id={`resultado-${r.id}`} role="option" aria-selected={i === ativo}>
                  <button
                    type="button"
                    onClick={() => ir(r.href)}
                    onMouseEnter={() => setAtivo(i)}
                    className={cn(
                      'flex w-full items-start gap-3 px-5 py-3 text-left transition-colors',
                      i === ativo ? 'bg-ink-700/60' : '',
                    )}
                  >
                    <span className="mt-0.5 shrink-0 rounded-full border border-line px-2 py-0.5 font-mono text-xs text-txt-2">
                      {r.tipo}
                    </span>
                    <span>
                      <span className="block text-body font-medium text-txt">{r.label}</span>
                      <span className="block text-small text-txt-2">{r.detalhe}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function KineticHeadline() {
  const reduced = useReducedMotion()
  if (reduced) return <h1 className="text-display font-medium">{HEADLINE}</h1>
  return (
    <h1 className="text-display font-medium" aria-label={HEADLINE}>
      {HEADLINE.split(' ').map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          aria-hidden="true"
          className="inline-block overflow-hidden pb-1 align-bottom"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 + i * 0.06, duration: 0.01 }}
        >
          <motion.span
            className="inline-block"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.6, ease: EASE }}
          >
            {word}
            {' '}
          </motion.span>
        </motion.span>
      ))}
    </h1>
  )
}

/** G1 — Hero do guia */
function HeroGuia() {
  const reduced = useReducedMotion()
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[60%] w-[80%] -translate-x-1/2 rounded-full opacity-[0.10]"
        style={{ background: 'radial-gradient(closest-side, #F2B53F, transparent)' }}
      />
      <div className="mx-auto max-w-[1080px] px-6 pb-20 pt-40 text-center lg:px-10">
        <p className="font-mono text-mono font-medium uppercase tracking-wider text-accent">
          Guia IsentaPCD · Grátis para sempre
        </p>
        <div className="mt-6">
          <KineticHeadline />
        </div>
        <motion.p
          initial={reduced ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
          className="mx-auto mt-6 max-w-[60ch] text-lead text-txt-2"
        >
          IPI, ICMS, IPVA, rodízio, requisitos, prazos e armadilhas — capítulo por capítulo, sem
          juridiquês, com as fontes oficiais linkadas.
        </motion.p>
        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
        >
          <BuscaGuia />
        </motion.div>
      </div>
    </section>
  )
}

/** G2 — Índice de capítulos */
function IndiceCapitulos() {
  return (
    <section aria-labelledby="capitulos-title" className="mx-auto max-w-content px-6 py-24 lg:px-10">
      <h2 id="capitulos-title" className="text-h2 font-medium">
        Capítulo por capítulo
      </h2>
      <p className="mt-4 max-w-prose68 text-body text-txt-2">
        Cada capítulo termina com as fontes oficiais e o nível de confiança de cada dado. Leia na
        ordem ou pule direto para a sua dúvida.
      </p>
      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {CAPITULOS.map((c) => (
          <motion.li
            key={c.slug}
            variants={{
              hidden: { y: 40, opacity: 0 },
              visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE } },
            }}
          >
            <Link
              to={`/guia/${c.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-amber-glow"
            >
              {c.imagem ? (
                <span className="block aspect-[4/3] overflow-hidden bg-ink-900">
                  <img
                    src={c.imagem}
                    alt={c.imagemAlt ?? ''}
                    width={800}
                    height={600}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="block aspect-[4/3] bg-ink-900 bg-[radial-gradient(closest-side,rgba(242,181,63,.14),transparent)]"
                />
              )}
              <span className="flex flex-1 flex-col p-5">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-accent">
                    Cap. {c.numero}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-txt-2">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {c.tempoLeitura}
                  </span>
                </span>
                <span className="mt-2 block text-h3 font-medium text-txt group-hover:text-accent">
                  {c.titulo}
                </span>
                <span className="mt-2 block text-small text-txt-2">{c.resumo}</span>
                <span className="mt-4 block">
                  <TrustBadge level={c.trust} />
                </span>
              </span>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}

/** G3 — Faixa "por estado" com mapa-cartograma + painel */
function PorEstado() {
  return (
    <section id="por-estado" aria-labelledby="por-estado-title" className="scroll-mt-24 bg-bg-alt">
      <div className="mx-auto max-w-content px-6 py-24 lg:px-10">
        <p className="font-mono text-mono font-medium uppercase tracking-wider text-accent">
          Regras por estado
        </p>
        <h2 id="por-estado-title" className="mt-3 text-h2 font-medium">
          Cada UF tem seu caminho. Veja o seu.
        </h2>
        <p className="mt-4 max-w-prose68 text-body text-txt-2">
          Selecione seu estado no mapa (ou na lista) para ver sistema oficial, taxas, tetos de ICMS
          e IPVA — cada dado com seu nível de confiança. O que não está cravado em fonte oficial
          aparece como "verificar com o órgão", nunca como fato.
        </p>
        <div className="mt-12">
          <UfMap />
        </div>
      </div>
    </section>
  )
}

/** G4 — CTA do hub (card âmbar invertido) */
function CtaHub() {
  const reduced = useReducedMotion()
  return (
    <section className="mx-auto max-w-content px-6 py-24 lg:px-10">
      <motion.div
        initial={reduced ? false : { scale: 0.98, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="rounded-card bg-accent p-8 text-center text-on-accent lg:p-16"
      >
        <h2 className="mx-auto max-w-[22ch] text-h2 font-medium">
          Leu, entendeu, mas quer a certeza do seu caso?
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-body">
          A pré-análise grátis cruza seu perfil com as regras do seu estado em 2 minutos.
        </p>
        <Link
          to="/pre-analise"
          className={cn(
            'mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-ink-950 px-8 font-bold text-paper-50 transition-transform hover:scale-[1.02] active:scale-[0.98]',
            !reduced && 'motion-safe-only animate-[pulse_3s_ease-in-out_infinite]',
          )}
        >
          Fazer a pré-análise grátis
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </motion.div>
    </section>
  )
}

export default function Guia() {
  useEffect(() => {
    document.title = 'Guia completo das isenções PCD: IPI, ICMS e IPVA — IsentaPCD'
    return () => {
      document.title = 'IsentaPCD'
    }
  }, [])

  return (
    <>
      <HeroGuia />
      <IndiceCapitulos />
      <PorEstado />
      <CtaHub />
    </>
  )
}

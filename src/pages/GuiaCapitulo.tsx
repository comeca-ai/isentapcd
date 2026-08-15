import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Clock, Pause, Play, RefreshCw } from 'lucide-react'
import TrustBadge from '@/components/TrustBadge'
import FaqAccordion from '@/components/guia/FaqAccordion'
import { CAPITULOS, CAPITULO_MAP } from '@/components/guia/capitulos'
import { CAPITULO_CONTENT } from '@/components/guia/CapituloContent'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const TITULOS_SEO: Record<string, string> = {
  ipi: 'IPI para PCD: teto, SISEN e passo a passo (2026) — IsentaPCD',
  icms: 'ICMS para PCD: regras por estado (2026) — IsentaPCD',
  ipva: 'IPVA para PCD: regras por estado (2026) — IsentaPCD',
  rodizio: 'Rodízio e credencial de estacionamento PCD — IsentaPCD',
  requisitos: 'Isenção de impostos PCD: quem tem direito (2026) — IsentaPCD',
  etapas: 'Isenção PCD: a jornada em 7 etapas — IsentaPCD',
  armadilhas: 'Isenção PCD: armadilhas que travam pedidos — IsentaPCD',
  'fontes-oficiais': 'Isenção PCD: fontes oficiais — IsentaPCD',
  faq: 'Isenção de impostos PCD: perguntas frequentes — IsentaPCD',
}

/** Botão "Ouvir" — leitura nativa via speechSynthesis com pausa/retomada. */
function BotaoOuvir({ articleRef }: { articleRef: React.RefObject<HTMLElement | null> }) {
  const [estado, setEstado] = useState<'idle' | 'tocando' | 'pausado'>('idle')
  const suportado = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    return () => {
      if (suportado) window.speechSynthesis.cancel()
    }
  }, [suportado])

  if (!suportado) return null

  function ouvir() {
    if (estado === 'tocando') {
      window.speechSynthesis.pause()
      setEstado('pausado')
      return
    }
    if (estado === 'pausado') {
      window.speechSynthesis.resume()
      setEstado('tocando')
      return
    }
    const texto = articleRef.current?.innerText ?? ''
    if (!texto) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(texto)
    utter.lang = 'pt-BR'
    utter.rate = 1
    utter.onend = () => setEstado('idle')
    window.speechSynthesis.speak(utter)
    setEstado('tocando')
  }

  function parar() {
    window.speechSynthesis.cancel()
    setEstado('idle')
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={ouvir}
        aria-pressed={estado !== 'idle'}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-4 text-small font-medium text-txt transition-colors hover:border-accent hover:text-accent"
      >
        {estado === 'tocando' ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
        {estado === 'idle' ? 'Ouvir' : estado === 'tocando' ? 'Pausar' : 'Continuar'}
      </button>
      {estado !== 'idle' && (
        <button
          type="button"
          onClick={parar}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-4 text-small font-medium text-txt-2 transition-colors hover:text-txt"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Recomeçar
        </button>
      )}
    </span>
  )
}

/** Sumário fixo com scroll-spy (âmbar na seção ativa). */
function Sumario({ secoes, ativo }: { secoes: { id: string; titulo: string }[]; ativo: string | null }) {
  return (
    <nav aria-label="Sumário do capítulo" className="sticky top-24 hidden lg:block">
      <p className="font-mono text-xs font-medium uppercase tracking-wider text-txt-2">
        Neste capítulo
      </p>
      <ul className="mt-4 space-y-1 border-l border-line">
        {secoes.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={ativo === s.id ? 'location' : undefined}
              className={cn(
                '-ml-px block border-l-2 py-1.5 pl-4 text-small transition-colors',
                ativo === s.id
                  ? 'border-accent font-medium text-accent'
                  : 'border-transparent text-txt-2 hover:text-txt',
              )}
            >
              {s.titulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function GuiaCapitulo() {
  const { capitulo: slug } = useParams<{ capitulo: string }>()
  const meta = slug ? CAPITULO_MAP[slug] : undefined
  const Content = slug ? CAPITULO_CONTENT[slug] : undefined
  const [ativo, setAtivo] = useState<string | null>(null)
  const articleRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const idx = CAPITULOS.findIndex((c) => c.slug === slug)
  const anterior = idx > 0 ? CAPITULOS[idx - 1] : null
  const proximo = idx >= 0 && idx < CAPITULOS.length - 1 ? CAPITULOS[idx + 1] : null

  useEffect(() => {
    if (meta) {
      document.title = TITULOS_SEO[meta.slug] ?? `${meta.titulo} — IsentaPCD`
    }
    return () => {
      document.title = 'IsentaPCD'
    }
  }, [meta])

  // Scroll-spy
  useEffect(() => {
    if (!meta) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setAtivo(entry.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    meta.secoes.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [meta])

  const rise = useMemo(
    () =>
      reduced
        ? {}
        : {
            initial: { y: 24, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { duration: 0.6, ease: EASE },
          },
    [reduced],
  )

  if (!meta || !Content) {
    return (
      <section className="mx-auto max-w-content px-6 py-24 lg:px-10">
        <h1 className="text-h1 font-medium">Capítulo não encontrado</h1>
        <p className="mt-4 max-w-prose68 text-lead text-txt-2">
          Este capítulo não existe (ainda). Veja todos os capítulos no{' '}
          <Link to="/guia" className="text-accent underline underline-offset-4">
            hub do guia
          </Link>
          .
        </p>
      </section>
    )
  }

  return (
    <>
      {/* C1 — Cabeçalho do capítulo */}
      <section className="mx-auto max-w-content px-6 pt-16 lg:px-10">
        <motion.div {...rise}>
          <nav aria-label="Trilha de navegação" className="font-mono text-mono text-txt-2">
            <Link to="/guia" className="underline-offset-4 hover:text-accent hover:underline">
              Guia
            </Link>
            <span aria-hidden="true"> / </span>
            <span className="text-accent">{meta.titulo}</span>
          </nav>

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[7fr_5fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <TrustBadge level={meta.trust} />
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-txt-2">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {meta.tempoLeitura} de leitura
                </span>
                <span className="font-mono text-xs text-txt-2">
                  Atualizado em {meta.atualizadoEm}
                </span>
              </div>
              <p className="mt-6 font-mono text-mono font-medium uppercase tracking-wider text-accent">
                Cap. {meta.numero}
              </p>
              <h1 className="mt-2 text-h1 font-medium">{meta.titulo}</h1>
              <p className="mt-4 max-w-[56ch] text-lead text-txt-2">{meta.resumo}</p>
              <div className="mt-6">
                <BotaoOuvir articleRef={articleRef} />
              </div>
            </div>
            {meta.imagem && (
              <motion.div
                initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)' }}
                animate={{ clipPath: 'inset(0 0% 0 0)' }}
                transition={{ duration: 0.8, ease: EASE }}
                className="overflow-hidden rounded-card border border-line"
              >
                <img
                  src={meta.imagem}
                  alt={meta.imagemAlt ?? ''}
                  width={800}
                  height={600}
                  className="h-auto w-full"
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* C2 — Corpo com sumário lateral */}
      <div className="mx-auto grid max-w-content gap-12 px-6 py-16 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-10">
        <Sumario secoes={meta.secoes} ativo={ativo} />
        <div ref={articleRef}>
          <motion.article
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="max-w-prose68 space-y-16"
          >
            <Content />
          </motion.article>

          {/* FAQ do capítulo */}
          {meta.faq.length > 0 && (
            <section aria-labelledby="faq-cap-title" className="mt-16">
              <h2 id="faq-cap-title" className="text-h2 font-medium">
                Perguntas deste capítulo
              </h2>
              <div className="mt-6">
                <FaqAccordion items={meta.faq} idPrefix={`faq-${meta.slug}`} />
              </div>
            </section>
          )}
        </div>
      </div>

      {/* C3 — Navegação de capítulos + CTA final */}
      <section className="mx-auto max-w-content px-6 pb-24 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {anterior ? (
            <Link
              to={`/guia/${anterior.slug}`}
              className="group rounded-card border border-line bg-surface p-5 transition-all hover:-translate-y-1 hover:border-accent/40"
            >
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-txt-2">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Cap. anterior
              </span>
              <span className="mt-2 block text-body font-medium text-txt group-hover:text-accent">
                {anterior.titulo}
              </span>
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          {proximo && (
            <Link
              to={`/guia/${proximo.slug}`}
              className="group rounded-card border border-line bg-surface p-5 text-right transition-all hover:-translate-y-1 hover:border-accent/40"
            >
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-txt-2">
                Próximo cap.
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="mt-2 block text-body font-medium text-txt group-hover:text-accent">
                {proximo.titulo}
              </span>
            </Link>
          )}
        </div>

        <div className="mt-12 rounded-card bg-accent p-8 text-on-accent lg:p-12">
          <h2 className="text-h2 font-medium">Pronto para o seu caso?</h2>
          <p className="mt-3 max-w-[52ch] text-body">
            A pré-análise grátis cruza o seu perfil com as regras do seu estado em 2 minutos — e te
            diz o caminho real, sem promessa vazia.
          </p>
          <Link
            to="/pre-analise"
            className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-ink-950 px-6 font-bold text-paper-50 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Fazer a pré-análise grátis
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  )
}

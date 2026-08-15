import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router'
import { Check, MessageCircle, ArrowRight } from 'lucide-react'
import { WHATSAPP_URL } from '@/lib/constants'
import { PAYWALL_ENABLED } from '@contracts/constants'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const GRATIS = [
  'Pré-análise de elegibilidade',
  'Simulador de economia',
  'Mapa do seu estado',
  'Guia completo',
  'Conteúdo educativo',
]

const PAGO = [
  'Checklist personalizado por órgão',
  'Revisão humana de cada documento antes do envio',
  'Passo a passo assistido para IPI e ICMS',
  'Alertas de prazo e carência',
  'Suporte humano no WhatsApp até a nota fiscal — e nos 4 anos de carência',
]

/** Contador de R$ 0 até 497 em 800ms ao entrar na viewport. */
function PriceCounter() {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-30% 0px' })
  const [animated, setAnimated] = useState<number | null>(null)

  useEffect(() => {
    if (reduced || !inView) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 800)
      const eased = 1 - Math.pow(1 - p, 3)
      setAnimated(Math.round(eased * 497))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced])

  const value = reduced ? 497 : (animated ?? 0)

  return (
    <span ref={ref} className="tnum font-mono text-6xl font-semibold text-accent">
      R$ {value}
    </span>
  )
}

/** S8 — Preço: transparência grátis vs pago. */
export default function Pricing() {
  return (
    <section aria-labelledby="preco-title" className="mx-auto max-w-content px-6 py-24 lg:px-10">
      <h2 id="preco-title" className="text-h2 font-medium">
        {PAYWALL_ENABLED ? 'Um preço. Sem letra miúda.' : 'Durante a prova de conceito, tudo grátis.'}
      </h2>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* Sempre grátis */}
        <div className="rounded-card border border-line bg-surface p-8">
          <h3 className="text-h3 font-medium">Sempre grátis</h3>
          <ul className="mt-6 space-y-3">
            {GRATIS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-body text-txt-2">
                <Check className="mt-1 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Pago */}
        <motion.div
          initial={{ scale: 0.97, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="rounded-card border border-accent bg-surface p-8 shadow-amber-glow"
        >
          <h3 className="text-h3 font-medium">Acompanhamento completo</h3>
          {PAYWALL_ENABLED ? (
            <p className="mt-4">
              <PriceCounter />{' '}
              <span className="text-small text-txt-2">(pagamento único)</span>
            </p>
          ) : (
            <>
              <p className="mt-4">
                <span className="tnum font-mono text-6xl font-semibold text-accent">R$ 0</span>{' '}
                <span className="text-small text-txt-2">durante a prova de conceito</span>
              </p>
              <p className="mt-2 inline-flex rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-small font-bold text-accent">
                Grátis durante a prova de conceito
              </p>
            </>
          )}
          <ul className="mt-6 space-y-3">
            {PAGO.map((item) => (
              <li key={item} className="flex items-start gap-3 text-body text-txt-2">
                <Check className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <p className="mt-10 max-w-prose68 text-lead text-txt">
        {PAYWALL_ENABLED
          ? 'Se a economia típica é de ~R$ 12 mil, o acompanhamento se paga dezenas de vezes.'
          : 'Enquanto durar a prova de conceito, você tem o acompanhamento completo sem pagar nada — incluindo revisão humana dos documentos.'}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          to="/pre-analise"
          className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-accent px-7 font-bold text-on-accent transition-all hover:bg-accent-hover hover:shadow-amber-glow active:scale-[0.98]"
        >
          Começar pela pré-análise grátis
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-whatsapp-dark px-6 font-medium text-white transition-colors hover:brightness-110"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Prefiro conversar com uma pessoa
        </a>
      </div>

      <p className="mt-6 text-small text-txt-2">
        {PAYWALL_ENABLED
          ? 'Sem mensalidade · Sem taxa escondida · Você só paga se decidir executar com a gente'
          : 'Sem mensalidade · Sem taxa escondida · Quando a POC terminar, avisamos antes de qualquer cobrança'}
      </p>
    </section>
  )
}

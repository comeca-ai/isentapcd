import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router'
import { MessageCircle, ArrowRight, MessageSquareText, ShieldCheck, Landmark } from 'lucide-react'
import CountdownChip from '@/components/CountdownChip'
import { WHATSAPP_URL } from '@/lib/constants'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

const HEADLINE =
  'Seu carro 0 km com até 20% de economia — sem se perder na burocracia.'

const TRUST_ITEMS = [
  { icon: MessageSquareText, label: 'Sem juridiquês' },
  { icon: ShieldCheck, label: 'Nunca pedimos sua senha do Gov.br' },
  { icon: Landmark, label: 'Quem aprova é o órgão público' },
]

/** Palavra a palavra (não caractere — evita quebra de leitura de tela). */
function KineticHeadline() {
  const reduced = useReducedMotion()
  const words = HEADLINE.split(' ')

  if (reduced) {
    return <h1 className="text-display font-medium">{HEADLINE}</h1>
  }

  return (
    <h1 className="text-display font-medium" aria-label={HEADLINE}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          aria-hidden="true"
          className="inline-block overflow-hidden pb-1 align-bottom"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.07, duration: 0.01 }}
        >
          <motion.span
            className="inline-block"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.6, ease: EASE_OUT_EXPO }}
          >
            {word === 'economia' ? <span className="text-accent">{word}</span> : word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </motion.span>
      ))}
    </h1>
  )
}

/** Formas decorativas com flutuação em loop (±10px, 6s). */
function FloatingShapes() {
  const reduced = useReducedMotion()
  if (reduced) return null

  const base = { duration: 6, repeat: Infinity, ease: 'easeInOut' as const }
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="absolute -left-8 -top-8 h-28 w-28 rounded-full border-2 border-moss-400/60"
        animate={{ y: [-10, 10, -10] }}
        transition={{ ...base, delay: 0 }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -bottom-10 -right-6 h-32 w-48 rounded-t-full border-2 border-coral-400/60 border-b-0"
        animate={{ y: [10, -10, 10] }}
        transition={{ ...base, delay: 1.2 }}
      />
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 120 40"
        className="absolute -bottom-6 left-6 h-10 w-32"
        animate={{ y: [-8, 12, -8] }}
        transition={{ ...base, delay: 2.4 }}
      >
        <path d="M2 30 C 30 10, 60 36, 118 12" fill="none" stroke="#F7F3EA" strokeWidth="8" strokeLinecap="round" />
        <path d="M2 30 C 30 10, 60 36, 118 12" fill="none" stroke="#F2B53F" strokeWidth="2" strokeDasharray="6 8" strokeLinecap="round" />
      </motion.svg>
    </>
  )
}

export default function Hero() {
  const reduced = useReducedMotion()
  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { y: 24, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: { delay, duration: 0.7, ease: EASE_OUT_EXPO },
        }

  return (
    <section className="relative overflow-hidden">
      {/* Luz de lamparina: gradiente radial âmbar atrás da ilustração */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-10%] top-[10%] h-[70%] w-[60%] rounded-full opacity-[0.12]"
        style={{ background: 'radial-gradient(closest-side, #F2B53F, transparent)' }}
      />
      <div className="mx-auto grid min-h-[100dvh] max-w-wide items-center gap-12 px-6 py-16 lg:grid-cols-[7fr_5fr] lg:px-10">
        <div>
          <p className="font-mono text-mono font-medium uppercase tracking-wider text-accent">
            Para todos os 27 estados · IPI + ICMS + IPVA
          </p>
          <div className="mt-4">
            <KineticHeadline />
          </div>
          <motion.p {...rise(0.7)} className="mt-6 max-w-[56ch] text-lead text-txt-2">
            A gente mostra se você (ou quem você cuida) tem direito às isenções, quanto dá para
            economizar no seu estado e guia cada etapa até a nota fiscal sair com o desconto.
          </motion.p>

          <motion.div {...rise(0.8)} className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/pre-analise"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-accent px-7 font-bold text-on-accent transition-all hover:bg-accent-hover hover:shadow-amber-glow active:scale-[0.98]"
            >
              Fazer pré-análise grátis
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-full border border-line px-6 font-medium text-txt transition-colors hover:border-whatsapp-dark hover:text-whatsapp-dark"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Falar no WhatsApp
            </a>
          </motion.div>
          <motion.p {...rise(0.9)} className="mt-3 text-small text-txt-2">
            Grátis · 2 minutos · Sem compromisso
          </motion.p>

          <motion.ul {...rise(1.0)} className="mt-6 flex flex-wrap gap-3" aria-label="Compromissos">
            {TRUST_ITEMS.map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-small text-txt-2"
              >
                <item.icon className="h-4 w-4 text-accent" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </motion.ul>

          <motion.div {...rise(1.1)} className="mt-8 max-w-md">
            <CountdownChip size="lg" />
          </motion.div>
        </div>

        {/* Visual */}
        <motion.div
          className="relative"
          initial={reduced ? false : { scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        >
          <FloatingShapes />
          <div className="relative overflow-hidden rounded-3xl border border-line">
            <img
              src="/hero-illustration.png"
              alt="Ilustração de uma família diversa — mãe, criança com fones abafadores e pai cadeirante — ao lado de um carro hatch 0 km cor âmbar, com uma fita de estrada virando um checklist de isenções carimbado."
              width={1600}
              height={1200}
              className="h-auto w-full"
              fetchPriority="high"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { MessageCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import CountdownChip from '@/components/CountdownChip'
import { WHATSAPP_URL } from '@/lib/constants'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** S11 — CTA final com gradiente radial âmbar e countdown repetido. */
export default function FinalCta() {
  const reduced = useReducedMotion()

  return (
    <section aria-labelledby="cta-final-title" className="relative overflow-hidden">
      {/* Gradiente radial âmbar forte */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.18] ${
          reduced ? '' : 'animate-breathe'
        }`}
        style={{ background: 'radial-gradient(closest-side, #F2B53F, transparent)' }}
      />
      {/* Ilustração em duotone recortada à direita */}
      <img
        src="/hero-illustration.png"
        alt=""
        aria-hidden="true"
        width={1600}
        height={1200}
        loading="lazy"
        className="pointer-events-none absolute -right-24 top-1/2 hidden w-[520px] -translate-y-1/2 opacity-60 mix-blend-luminosity lg:block"
        style={{
          maskImage: 'linear-gradient(to left, black 40%, transparent)',
          WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent)',
        }}
      />

      <div className="relative mx-auto max-w-[880px] px-6 py-28 text-center lg:px-10">
        <motion.h2
          id="cta-final-title"
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-h1 font-medium"
        >
          O relógio das regras atuais está correndo.
        </motion.h2>
        <motion.p
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
          className="mx-auto mt-6 max-w-prose68 text-lead text-txt-2"
        >
          Comece pela pré-análise gratuita e trave o regime vigente. Se não tiver direito, você
          descobre em 2 minutos — de graça.
        </motion.p>

        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
          className="mx-auto mt-8 max-w-md"
        >
          <CountdownChip size="lg" />
        </motion.div>

        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/pre-analise"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-accent px-8 font-bold text-on-accent transition-all hover:bg-accent-hover hover:shadow-amber-glow active:scale-[0.98]"
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

        <p className="mt-6 inline-flex items-center gap-2 text-small text-txt-2">
          <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
          Nunca pedimos sua senha do Gov.br
        </p>
      </div>
    </section>
  )
}

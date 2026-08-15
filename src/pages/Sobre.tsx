import { useEffect } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Compass,
  KeyRound,
  Megaphone,
  MessageCircle,
  Accessibility,
  Route,
} from 'lucide-react'
import { WHATSAPP_URL } from '@/lib/constants'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const HISTORIA = [
  {
    titulo: 'O problema',
    texto:
      'Informação espalhada em 27 portais, linguagem hostil e despachantes prometendo o impossível. Nossa família quase desistiu da isenção por falta de informação clara.',
  },
  {
    titulo: 'A virada',
    texto:
      'Mapeamos cada órgão, cada prazo e cada armadilha — e traduzimos tudo para linguagem humana, com a fonte oficial ao lado de cada dado.',
  },
  {
    titulo: 'Hoje',
    texto:
      'Uma plataforma + um time humano no WhatsApp, do quiz à nota fiscal, guiando PCDs e famílias em todos os 27 estados.',
  },
]

const PRINCIPIOS = [
  {
    icon: KeyRound,
    titulo: 'Você no controle',
    texto: 'Nunca pedimos sua senha do Gov.br. Você acessa os portais; a gente orienta.',
  },
  {
    icon: Compass,
    titulo: 'Transparência radical',
    texto:
      'O que é grátis e o que custa R$ 497 está aberto na página de transparência. Quem defere é sempre o órgão público.',
  },
  {
    icon: Accessibility,
    titulo: 'Acessibilidade como identidade',
    texto:
      'Contraste AA, navegação por teclado, respeito a movimento reduzido e linguagem simples em tudo.',
  },
  {
    icon: Megaphone,
    titulo: 'Sem promessa vazia',
    texto:
      'Não garantimos deferimento — e dizemos isso em voz alta. Prometer o que depende de órgão público é golpe.',
  },
]

export default function Sobre() {
  const reduced = useReducedMotion()

  useEffect(() => {
    document.title = 'Quem somos — IsentaPCD'
    return () => {
      document.title = 'IsentaPCD'
    }
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-[1080px] px-6 pb-16 pt-24 lg:px-10">
        <motion.div
          initial={reduced ? false : { y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="font-mono text-mono font-medium uppercase tracking-wider text-accent">
            Quem somos
          </p>
          <h1 className="mt-4 max-w-[18ch] text-h1 font-medium">
            A gente existe porque burocracia não deveria custar direitos.
          </h1>
          <p className="mt-6 max-w-prose68 text-lead text-txt-2">
            O IsentaPCD nasceu de uma família que quase desistiu da isenção por falta de informação
            clara. Hoje guiamos PCDs e famílias em todos os 27 estados.
          </p>
        </motion.div>
      </section>

      {/* História em 3 blocos */}
      <section aria-labelledby="historia-title" className="mx-auto max-w-[1080px] px-6 py-16 lg:px-10">
        <h2 id="historia-title" className="text-h2 font-medium">
          Nossa história
        </h2>
        <ol className="relative mt-10 space-y-10 border-l-2 border-line pl-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0 lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-8">
          {HISTORIA.map((bloco, i) => (
            <motion.li
              key={bloco.titulo}
              initial={reduced ? false : { y: 16, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
              className="relative"
            >
              <span
                aria-hidden="true"
                className="absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-bg bg-accent lg:-top-[42px] lg:left-0"
              />
              <p className="font-mono text-xs uppercase tracking-wider text-accent">
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-2 text-h3 font-medium">{bloco.titulo}</h3>
              <p className="mt-3 text-body text-txt-2">{bloco.texto}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Ilustração do time */}
      <section className="mx-auto max-w-[1080px] px-6 py-16 lg:px-10">
        <figure>
          <img
            src="/about-team.png"
            alt="Ilustração de uma equipe pequena e diversa em volta de uma mesa com um mapa do Brasil e balões de conversa."
            width={1600}
            height={900}
            loading="lazy"
            className="w-full rounded-[24px] border border-line"
          />
          <figcaption className="mt-3 text-small text-txt-2">
            Time pequeno, obsessivo por clareza.
          </figcaption>
        </figure>
      </section>

      {/* Princípios */}
      <section aria-labelledby="principios-title" className="bg-bg-alt">
        <div className="mx-auto max-w-[1080px] px-6 py-24 lg:px-10">
          <h2 id="principios-title" className="text-h2 font-medium">
            O que a gente não negocia
          </h2>
          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="mt-10 grid gap-6 sm:grid-cols-2"
          >
            {PRINCIPIOS.map((p) => (
              <motion.li
                key={p.titulo}
                variants={{
                  hidden: { opacity: 0, rotateX: reduced ? 0 : 6, y: 16 },
                  visible: { opacity: 1, rotateX: 0, y: 0, transition: { duration: 0.5, ease: EASE } },
                }}
                className="rounded-card border border-line bg-surface p-6"
              >
                <p.icon className="h-7 w-7 text-accent" aria-hidden="true" />
                <h3 className="mt-4 text-h3 font-medium">{p.titulo}</h3>
                <p className="mt-2 text-body text-txt-2">{p.texto}</p>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1080px] px-6 py-24 lg:px-10">
        <div className="rounded-card border border-line bg-surface p-8 text-center lg:p-12">
          <Route className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
          <h2 className="mx-auto mt-4 max-w-[24ch] text-h2 font-medium">
            O próximo capítulo pode ser o seu.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/pre-analise"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-accent px-6 font-bold text-on-accent transition-all hover:bg-accent-hover active:scale-[0.98]"
            >
              Conheça a pré-análise grátis
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-whatsapp-dark px-6 font-medium text-white transition-colors hover:brightness-110"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

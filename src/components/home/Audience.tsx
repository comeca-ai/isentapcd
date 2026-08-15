import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { Car, HeartHandshake, Check } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const CARDS = [
  {
    icon: Car,
    title: 'Eu vou dirigir o carro',
    text: 'PCD condutor com CNH especial — a isenção é sua e o carro fica no seu nome.',
    items: [
      'CNH com observação de restrição (ou nem sempre necessária — entenda no Guia)',
      'Laudo médico',
      'Carro até R$ 200 mil',
    ],
  },
  {
    icon: HeartHandshake,
    title: 'Compro para quem eu cuido',
    text: 'Pais, filhos e responsáveis legais podem comprar para PCD não condutor — muito comum com autismo e deficiências na infância.',
    items: [
      'O carro fica no nome da pessoa com deficiência',
      'Você entra como condutor autorizado',
      'Vale para autismo em todos os níveis (ver prova legal)',
    ],
  },
]

/** S3 — Público: dois cards grandes. */
export default function Audience() {
  return (
    <section aria-labelledby="publico-title" className="mx-auto max-w-content px-6 py-24 lg:px-10">
      <h2 id="publico-title" className="text-h2 font-medium">
        Você ou sua família pode ter direito
      </h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {CARDS.map((card, i) => (
          <motion.article
            key={card.title}
            initial={{ y: 48, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: i * 0.15, duration: 0.6, ease: EASE }}
            className="flex h-full flex-col rounded-card border border-line bg-surface p-8 transition-all duration-200 hover:-translate-y-1 hover:border-accent/40"
          >
            <card.icon className="h-10 w-10 text-accent" aria-hidden="true" />
            <h3 className="mt-4 text-h3 font-medium">{card.title}</h3>
            <p className="mt-3 text-body text-txt-2">{card.text}</p>
            <ul className="mt-5 space-y-3">
              {card.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-small text-txt-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-6">
              <Link to="/guia" className="text-small font-medium text-accent underline underline-offset-4 hover:text-accent-hover">
                Ver todos os requisitos no Guia →
              </Link>
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import { Link } from 'react-router'
import TrustBadge from '@/components/TrustBadge'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const DECISOES = [
  { tribunal: 'STF', ano: 2026, texto: 'É inconstitucional excluir autista nível 1 e deficiência "leve" da alíquota zero do novo regime.' },
  { tribunal: 'STF', ano: 2024, texto: 'Isenção de ICMS para PCD e autistas é constitucional em todo o Brasil.' },
  { tribunal: 'STJ', ano: 2025, texto: 'Isenção de IPI não pode exigir restrição na CNH nem adaptação do veículo.' },
  { tribunal: 'STJ', ano: 2025, texto: 'Negar IPI a pessoa autista por receber BPC é ilegal.' },
  { tribunal: 'STJ', ano: 2019, texto: 'Autista não condutor tem direito à isenção de IPVA.' },
]

/** S7 — Prova legal & jurisprudência. */
export default function LegalProof() {
  return (
    <section aria-labelledby="prova-legal-title" className="bg-bg-alt">
      <div className="mx-auto max-w-content px-6 py-24 lg:px-10">
        <h2 id="prova-legal-title" className="text-h2 font-medium">
          O direito é seu — e está escrito
        </h2>
        <p className="mt-4 max-w-prose68 text-lead text-txt-2">
          Não é favor, não é jeitinho: é direito. Estas decisões dos tribunais superiores sustentam o seu pedido.
        </p>

        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {DECISOES.map((d, i) => (
            <motion.li
              key={`${d.tribunal}-${d.ano}-${i}`}
              initial={{ rotateX: 8, opacity: 0 }}
              whileInView={{ rotateX: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: EASE }}
              whileHover={{ scale: 1.02 }}
              className={`group rounded-card border border-line bg-surface p-6 transition-colors hover:border-accent ${
                i >= 3 ? 'lg:col-span-1 lg:col-start-auto' : ''
              }`}
            >
              <p className="tnum font-mono text-mono font-semibold text-accent">
                {d.tribunal} · {d.ano}
              </p>
              <p className="mt-3 text-body text-txt">{d.texto}</p>
              <TrustBadge level="official" className="mt-4" />
            </motion.li>
          ))}
        </ul>

        <p className="mt-10 text-body text-txt-2">
          Transcrevemos as decisões em linguagem simples.{' '}
          <Link to="/guia" className="font-medium text-accent underline underline-offset-4 hover:text-accent-hover">
            Leia os fundamentos completos no Guia →
          </Link>
        </p>
        <p className="mt-3 text-small text-txt-2">
          Jurisprudência orienta, mas quem decide cada pedido é o órgão público.
        </p>
      </div>
    </section>
  )
}

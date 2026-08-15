import { useState } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { WHATSAPP_URL } from '@/lib/constants'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const FAQ = [
  {
    q: 'Preciso pagar alguma taxa antes de enviar o pedido?',
    a: 'Na Receita Federal, não: é gratuito. Alguns estados cobram taxas pequenas (RJ ~R$ 280; SC exige guia paga antes da análise; MS exige a DAEMS; em SP só a perícia médica, ~R$ 269). Na maioria, nada. Atenção em todos: IPVA e multas em aberto travam o pedido — quite antes.',
  },
  {
    q: 'Vocês pedem minha senha do Gov.br?',
    a: 'Nunca. Você entra com a sua própria conta; nós orientamos, não acessamos.',
  },
  {
    q: 'Quem aprova meu pedido?',
    a: 'Sempre o órgão público (Receita Federal e Secretaria da Fazenda do seu estado). Nós guiamos você; a decisão é deles.',
  },
  {
    q: 'Até quanto posso gastar no carro?',
    a: 'R$ 200 mil (IPI). ICMS: isenção total até R$ 70 mil e parcial até R$ 120 mil. IPVA varia por estado.',
  },
  {
    q: 'É para meu filho / eu não dirijo. Posso?',
    a: 'Sim: o carro fica no nome da pessoa com deficiência e você entra como condutor autorizado, com laudo.',
  },
  {
    q: 'Tenho visão monocular / autismo leve. E aí?',
    a: 'São casos cinzentos: muitas vezes negados no administrativo e garantidos na Justiça. Explicamos com transparência antes de você decidir.',
  },
  {
    q: 'E se eu vender o carro antes?',
    a: 'Existem carências: 2 anos (IPI) e 4 anos (ICMS). Vendendo antes, parte do imposto volta. A gente te lembra as datas.',
  },
  {
    q: 'As regras vão mudar em 2027?',
    a: 'Sim, com a Reforma Tributária (alíquota zero, benefício sobre operação até R$ 100 mil, 1 carro a cada 3 anos). Quem iniciar até 31/12/2026 trava o regime atual — por isso o relógio no topo da página.',
  },
]

/** S10 — FAQ acordeão (aria-expanded, chevron animado). */
export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 bg-bg">
      <div className="mx-auto max-w-[880px] px-6 py-24 lg:px-10">
        <h2 id="faq-title" className="text-h2 font-medium">
          Perguntas de quem está começando
        </h2>

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          className="mt-10 divide-y divide-line rounded-card border border-line bg-surface"
        >
          {FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <motion.li
                key={item.q}
                variants={{
                  hidden: { y: 16, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: EASE } },
                }}
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-button-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-4 px-6 py-4 text-left text-body font-medium text-txt transition-colors hover:text-accent"
                  >
                    {item.q}
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-accent transition-transform duration-300 ease-ease-out-expo ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-button-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-body text-txt-2">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            )
          })}
        </motion.ul>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Não achou sua dúvida? Fale com a gente no WhatsApp →
          </a>
          <Link
            to="/guia"
            className="font-medium text-txt-2 underline underline-offset-4 hover:text-txt"
          >
            Ver FAQ completo no Guia
          </Link>
        </div>
      </div>
    </section>
  )
}

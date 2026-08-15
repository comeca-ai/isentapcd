import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const DEPOIMENTOS = [
  {
    img: '/testimonial-1.png',
    alt: 'Ilustração de Camila, mãe sorrindo com o braço em volta do filho Theo, que usa fones abafadores.',
    quem: 'Camila, mãe do Theo (autismo, nível 1 de suporte) · SP',
    texto:
      'Eu achava que autismo nível de suporte 1 não tinha direito. O IsentaPCD me mostrou o caminho certo e os documentos exatos.',
  },
  {
    img: '/testimonial-2.png',
    alt: 'Ilustração de Rodrigo, homem adulto confiante ao volante de um carro.',
    quem: 'Rodrigo, condutor com deficiência física · PR',
    texto:
      'Perdi meses com informação errada. Com o mapa do meu estado, fechei o carro com a isenção na nota fiscal.',
  },
  {
    img: '/testimonial-3.png',
    alt: 'Ilustração de Beatriz abraçando sua mãe idosa, que segura uma bengala.',
    quem: 'Beatriz, filha e condutora autorizada da mãe · BA',
    texto:
      'Minha mãe não dirige mais. Aprendi que eu podia ser a condutora autorizada e ela, dona do carro isento.',
  },
]

/** S9 — Depoimentos: carrossel com setas 44px, dots e drag no mobile. */
export default function Testimonials() {
  const [index, setIndex] = useState(0)
  const [perView, setPerView] = useState(1)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setPerView(mq.matches ? 3 : 1)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const maxIndex = Math.max(0, DEPOIMENTOS.length - perView)
  const clamped = Math.min(index, maxIndex)

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIndex((i) => Math.min(maxIndex, i + 1)), [maxIndex])

  return (
    <section aria-labelledby="depoimentos-title" className="bg-bg-alt">
      <div className="mx-auto max-w-wide px-6 py-24 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="depoimentos-title" className="text-h2 font-medium">
            Quem já passou por isso com a gente
          </h2>
          {perView === 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={prev}
                disabled={clamped === 0}
                aria-label="Depoimento anterior"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-txt transition-colors hover:border-accent disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={clamped === maxIndex}
                aria-label="Próximo depoimento"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-txt transition-colors hover:border-accent disabled:opacity-40"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-10 overflow-hidden">
          <motion.ul
            className="flex gap-6"
            animate={{ x: perView === 1 ? `calc(-${clamped} * (100% + 1.5rem))` : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            drag={perView === 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) next()
              else if (info.offset.x > 60) prev()
            }}
          >
            {DEPOIMENTOS.map((d, i) => (
              <motion.li
                key={d.quem}
                initial={{ y: 32, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="w-full shrink-0 rounded-card border border-line bg-surface p-8 lg:w-[calc((100%-3rem)/3)]"
              >
                <Quote className="h-8 w-8 text-accent" aria-hidden="true" />
                <blockquote className="mt-4 text-body text-txt">“{d.texto}”</blockquote>
                <figure className="mt-6 flex items-center gap-4">
                  <img
                    src={d.img}
                    alt={d.alt}
                    width={96}
                    height={96}
                    loading="lazy"
                    className="h-14 w-14 rounded-full border border-line object-cover"
                  />
                  <figcaption className="text-small text-txt-2">{d.quem}</figcaption>
                </figure>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {perView === 1 && (
          <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="Escolher depoimento">
            {DEPOIMENTOS.map((d, i) => (
              <button
                key={d.quem}
                type="button"
                role="tab"
                aria-selected={clamped === i}
                aria-label={`Depoimento ${i + 1} de ${DEPOIMENTOS.length}`}
                onClick={() => setIndex(i)}
                className={`h-3 min-h-[24px] min-w-[24px] rounded-full p-1.5 transition-colors ${
                  clamped === i ? 'bg-accent' : 'bg-line hover:bg-txt-2'
                }`}
              />
            ))}
          </div>
        )}

        <p className="mt-8 text-small text-txt-2">
          Histórias representativas de clientes reais, com nomes adaptados para privacidade.
        </p>
      </div>
    </section>
  )
}

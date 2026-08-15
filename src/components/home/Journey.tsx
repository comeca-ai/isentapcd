import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '@/hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

const ETAPAS = [
  {
    title: 'Descubra se você tem direito',
    text: 'Quiz gratuito de 2 minutos: tipo de deficiência, seu estado, condutor ou não. Sem cadastro chato.',
    img: '/journey-1.png',
    alt: 'Ilustração de uma lupa sobre um escudo com sinal de confirmação, representando a descoberta do direito às isenções.',
  },
  {
    title: 'Receba seu mapa',
    text: 'O que vale no seu estado, quanto dá para economizar e a lista exata de documentos. Direto no seu WhatsApp e e-mail.',
    img: '/journey-2.png',
    alt: 'Ilustração do mapa do Brasil com alfinetes âmbar marcando os estados.',
  },
  {
    title: 'Organize seus documentos',
    text: 'Checklist guiado: laudo médico, CNH, documentos da família. A gente revisa tudo antes de você enviar.',
    img: '/journey-3.png',
    alt: 'Ilustração de uma pasta aberta com um checklist e um lápis.',
  },
  {
    title: 'Peça a isenção do IPI',
    text: 'Passo a passo no sistema da Receita Federal (SISEN), com a sua própria conta Gov.br. Nunca pedimos sua senha.',
    img: '/journey-4.png',
    alt: 'Ilustração de um prédio do governo federal com um carimbo de aprovação.',
  },
  {
    title: 'Peça a isenção do ICMS',
    text: 'No portal do seu estado, com o IPI já deferido (exceção: síndrome de Down pode pedir junto). Avisamos as taxas de cada estado antes.',
    img: '/journey-5.png',
    alt: 'Ilustração de bandeiras dos estados brasileiros dispostas como cartas em um leque.',
  },
  {
    title: 'Compre o carro',
    text: 'Escolha dentro do teto, leve suas autorizações à concessionária e veja a isenção destacada na nota fiscal.',
    img: '/journey-6.png',
    alt: 'Ilustração de duas mãos trocando uma chave de carro sobre uma nota fiscal com desconto destacado.',
  },
  {
    title: 'Depois da compra',
    text: 'IPVA, rodízio, credencial de estacionamento e lembretes automáticos de prazos e carências (2 anos IPI / 4 anos ICMS).',
    img: '/journey-7.png',
    alt: 'Ilustração de um calendário com datas marcadas e um sino de lembrete.',
  },
]

/**
 * S6 — Jornada em 7 etapas (seção pinada, GSAP ScrollTrigger).
 * Desktop: pin 200vh/etapa com ilustração fixa e painel trocando.
 * Mobile/reduced motion: cards estáticos empilhados.
 */
export default function Journey() {
  const rootRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !rootRef.current) return
    // Apenas desktop tem pin; mobile usa a versão estática (renderizada separadamente)
    if (window.matchMedia('(max-width: 767px)').matches) return

    const ctx = gsap.context(() => {
      const total = ETAPAS.length
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: `+=${total * 200}%`,
        pin: '[data-pin-stage]',
        scrub: true,
        onUpdate: (self) => {
          const idx = Math.min(total - 1, Math.floor(self.progress * total))
          setActive((prev) => (prev === idx ? prev : idx))
        },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [reduced])

  const etapa = ETAPAS[active]

  const textPanel = (i: number) => (
    <>
      <p className="tnum font-mono text-mono text-accent" aria-hidden="true">
        Etapa {i + 1} de {ETAPAS.length}
      </p>
      <h3 className="mt-3 text-h2 font-medium">{ETAPAS[i].title}</h3>
      <p className="mt-4 text-lead text-txt-2">{ETAPAS[i].text}</p>
    </>
  )

  return (
    <section ref={rootRef} aria-labelledby="jornada-title" className="bg-bg">
      {/* Versão estática: mobile + reduced motion */}
      <div className={`mx-auto max-w-content px-6 py-24 lg:px-10 ${reduced ? '' : 'md:hidden'}`}>
        <h2 id="jornada-title" className="text-h2 font-medium">
          A jornada completa, em 7 etapas
        </h2>
        <ol className="mt-12 space-y-10">
          {ETAPAS.map((e, i) => (
            <li key={e.title} className="rounded-card border border-line bg-surface p-6">
              <img
                src={e.img}
                alt={e.alt}
                width={900}
                height={900}
                loading="lazy"
                className="mx-auto h-48 w-48 rounded-card object-cover"
              />
              <div className="mt-5">{textPanel(i)}</div>
            </li>
          ))}
        </ol>
      </div>

      {/* Versão pinada: desktop */}
      <div className={reduced ? 'hidden' : 'hidden md:block'}>
        <div
          data-pin-stage
          className="mx-auto flex min-h-[100dvh] max-w-wide items-center gap-16 px-6 lg:px-10"
        >
          {/* Barra de progresso vertical */}
          <div aria-hidden="true" className="flex flex-col gap-2">
            {ETAPAS.map((e, i) => (
              <span
                key={e.title}
                className={`h-10 w-1.5 rounded-full transition-colors duration-300 ${
                  i <= active ? 'bg-accent' : 'bg-line'
                }`}
              />
            ))}
          </div>

          {/* Esquerda fixa: número gigante + ilustração */}
          <div className="relative flex flex-1 items-center justify-center">
            <span
              aria-hidden="true"
              className="tnum pointer-events-none absolute -left-4 top-0 select-none font-mono text-[120px] font-semibold leading-none text-transparent"
              style={{ WebkitTextStroke: '2px rgba(242,181,63,.55)' }}
            >
              {String(active + 1).padStart(2, '0')}
            </span>
            <div className="relative h-[420px] w-[420px] overflow-hidden rounded-3xl border border-line lg:h-[520px] lg:w-[520px]">
              {ETAPAS.map((e, i) => (
                <img
                  key={e.img}
                  src={e.img}
                  alt={i === active ? e.alt : ''}
                  width={900}
                  height={900}
                  loading={i > 1 ? 'lazy' : undefined}
                  className={`absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-500 ${
                    i === active
                      ? 'translate-y-0 opacity-100'
                      : i < active
                        ? '-translate-y-[60px] opacity-0'
                        : 'translate-y-[60px] opacity-0'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Direita: painel de texto */}
          <div className="flex-1">
            <h2 id="jornada-title-desktop" className="sr-only">
              A jornada completa, em 7 etapas
            </h2>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              Etapa {active + 1} de {ETAPAS.length}: {etapa.title}
            </div>
            <div key={active} className="motion-safe-only">
              {textPanel(active)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

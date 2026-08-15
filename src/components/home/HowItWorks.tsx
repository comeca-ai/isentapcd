import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '@/hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    num: '01',
    title: 'Descubra (grátis)',
    text: 'Pré-análise de 2 minutos e simulador mostram se você tem direito e quanto dá para economizar no seu estado.',
  },
  {
    num: '02',
    title: 'Receba seu mapa (grátis)',
    text: 'Você recebe o passo a passo exato para o seu caso: documentos, órgãos, prazos e armadilhas do seu estado.',
  },
  {
    num: '03',
    title: 'Execute com a gente (R$ 497, único pagamento)',
    text: 'Checklist guiado, revisão humana dos seus documentos, acompanhamento até a nota fiscal e lembretes dos prazos depois da compra.',
  },
]

/** S4 — Como funciona: linha tracejada desenhada via scrub, colunas entram em stagger. */
export default function HowItWorks() {
  const rootRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !rootRef.current) return
    const ctx = gsap.context(() => {
      const line = rootRef.current!.querySelector<SVGPathElement>('[data-connector]')
      if (line) {
        const len = line.getTotalLength()
        gsap.set(line, { strokeDasharray: len, strokeDashoffset: len })
        gsap.to(line, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top 70%', end: 'bottom 60%', scrub: true },
        })
      }
      gsap.from('[data-step]', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.2,
        scrollTrigger: { trigger: rootRef.current, start: 'top 60%', once: true },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      id="como-funciona"
      ref={rootRef}
      aria-labelledby="como-funciona-title"
      className="scroll-mt-24 bg-bg"
    >
      <div className="mx-auto max-w-content px-6 py-24 lg:px-10">
        <h2 id="como-funciona-title" className="text-h2 font-medium">
          Como funciona — sem juridiquês
        </h2>

        <div className="relative mt-14">
          {/* Linha conectora tracejada (desktop) */}
          <svg
            aria-hidden="true"
            className="absolute left-0 right-0 top-10 hidden h-2 w-full lg:block"
            preserveAspectRatio="none"
            viewBox="0 0 100 2"
          >
            <path
              data-connector
              d="M0 1 H 100"
              fill="none"
              stroke="#F2B53F"
              strokeOpacity="0.4"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <ol className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            {STEPS.map((step) => (
              <li key={step.num} data-step className="relative">
                <span
                  aria-hidden="true"
                  className="tnum block bg-bg font-mono text-[64px] font-semibold leading-none text-accent"
                >
                  {step.num}
                </span>
                <h3 className="mt-4 text-h3 font-medium">{step.title}</h3>
                <p className="mt-3 text-body text-txt-2">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

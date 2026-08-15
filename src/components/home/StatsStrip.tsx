import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TrustBadge from '@/components/TrustBadge'
import { useReducedMotion } from '@/hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { value: 20, prefix: 'Até ', suffix: '%', label: 'economia típica no preço do carro (IPI + ICMS + IPVA)', badge: 'official' as const },
  { value: 27, prefix: '', suffix: ' UFs', label: 'cobertura nacional desde o primeiro dia', badge: 'official' as const },
  { value: 200, prefix: 'R$ ', suffix: ' mil', label: 'teto do carro para a isenção de IPI', badge: 'official' as const },
  { value: 497, prefix: 'R$ ', suffix: '', label: 'preço único do acompanhamento completo', badge: 'official' as const, badgeSuffix: 'preço público e fixo' },
]

/** S2 — Faixa de prova imediata: contadores sobem ao entrar 60% na viewport (GSAP). */
export default function StatsStrip() {
  const rootRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !rootRef.current) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-stat]').forEach((el) => {
        const target = Number(el.dataset.stat)
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 60%', once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v))
          },
          onComplete: () => {
            el.textContent = String(target)
          },
        })
      })
    }, rootRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section ref={rootRef} aria-label="Números oficiais" className="bg-bg-alt">
      <div className="mx-auto grid max-w-wide grid-cols-2 gap-8 px-6 py-14 lg:grid-cols-4 lg:px-10">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="tnum font-mono text-4xl font-semibold text-accent sm:text-5xl">
              {s.prefix}
              <span data-stat={s.value}>{reduced ? s.value : 0}</span>
              {s.suffix}
            </p>
            <p className="mt-2 text-small text-txt-2">{s.label}</p>
            <TrustBadge level={s.badge} suffix={s.badgeSuffix} className="mt-3" />
          </div>
        ))}
      </div>
    </section>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export interface FaqItem {
  q: string
  a: string
}

interface FaqAccordionProps {
  items: FaqItem[]
  /** Prefixo dos ids ARIA (único por página). */
  idPrefix?: string
}

/** Acordeão de FAQ acessível (aria-expanded + chevron), mesmo padrão da home. */
export default function FaqAccordion({ items, idPrefix = 'faq' }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(null)
  const reduced = useReducedMotion()

  return (
    <ul className="divide-y divide-line rounded-card border border-line bg-surface">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <li key={item.q}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-panel-${i}`}
                id={`${idPrefix}-button-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-[56px] w-full items-center justify-between gap-4 px-6 py-4 text-left text-body font-medium text-txt transition-colors hover:text-accent"
              >
                {item.q}
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-txt-2 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${idPrefix}-panel-${i}`}
                  role="region"
                  aria-labelledby={`${idPrefix}-button-${i}`}
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-body text-txt-2">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { UF_OPTIONS, type QuizStep } from './tree'

interface QuestionStepProps {
  step: QuizStep
  value: string | undefined
  onAnswer: (stepId: string, value: string) => void
  onNext: () => void
  onBack: () => void
  canBack: boolean
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

/**
 * Tela de pergunta do quiz (quiz.md Q1): fieldset + legend = pergunta,
 * opções como radios reais estilizados (cards ≥64px, letra de atalho mono),
 * setas trocam opção (navegação nativa de radio), Enter avança, Backspace volta.
 * Avanço automático 350ms após escolha em pergunta de opção única.
 */
export default function QuestionStep({
  step,
  value,
  onAnswer,
  onNext,
  onBack,
  canBack,
}: QuestionStepProps) {
  const reduced = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [whyOpen, setWhyOpen] = useState(false)
  const advanceTimer = useRef<number | null>(null)

  // Foco na pergunta a cada troca de tela (leitores de tela + teclado)
  useEffect(() => {
    headingRef.current?.focus()
    return () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
    }
  }, [step.id])

  function choose(v: string) {
    onAnswer(step.id, v)
    if (step.kind === 'single') {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
      advanceTimer.current = window.setTimeout(onNext, 350)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    // Não intercepta Enter/Backspace vindos de botões, links ou selects
    if ((e.target as HTMLElement).closest('button, a, select')) return
    if (e.key === 'Enter' && step.kind !== 'contact') {
      // Enter em select nativo abre as opções — não interceptar
      if (step.kind === 'select') return
      e.preventDefault()
      if (value) onNext()
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      if (canBack) onBack()
    }
  }

  return (
    <motion.div
      key={step.id}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -32 }}
      transition={
        reduced
          ? { duration: 0.15 }
          : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
      }
      onKeyDown={onKeyDown}
      className="mx-auto flex w-full max-w-2xl flex-col"
    >
      <fieldset className="flex flex-col">
        <legend className="contents">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-center font-display text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-tight outline-none [text-wrap:balance]"
          >
            {step.question}
          </h2>
        </legend>
        {step.hint && (
          <p className="mt-2 text-center text-small text-txt-2">{step.hint}</p>
        )}
        {step.why && (
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => setWhyOpen((v) => !v)}
              aria-expanded={whyOpen}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-small text-txt-2 underline decoration-dotted underline-offset-4 hover:text-txt"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Por que perguntamos isso?
            </button>
            {whyOpen && (
              <p className="mx-auto mt-2 max-w-md rounded-input border border-line bg-surface p-3 text-left text-small text-txt-2">
                {step.why}
              </p>
            )}
          </div>
        )}

        {step.kind === 'select' && (
          <div className="mx-auto mt-8 w-full max-w-md">
            <label htmlFor={`quiz-${step.id}`} className="mb-1 block text-small font-bold">
              Estado (UF)
            </label>
            <select
              id={`quiz-${step.id}`}
              value={value ?? ''}
              onChange={(e) => onAnswer(step.id, e.target.value)}
              className="h-[52px] w-full appearance-none rounded-input border-[1.5px] border-line bg-surface px-4 text-body text-txt outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            >
              <option value="" disabled>
                Escolha seu estado
              </option>
              {UF_OPTIONS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        )}

        {step.kind === 'single' && (
          <div className="mt-8 flex flex-col gap-3">
            {step.options?.map((opt, i) => {
              const selected = value === opt.value
              return (
                <motion.label
                  key={opt.value}
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: reduced ? 0 : i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex min-h-[64px] cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-3 transition-colors',
                    selected
                      ? 'border-accent bg-surface'
                      : 'border-line hover:border-accent/40 hover:bg-surface/60',
                  )}
                >
                  <input
                    type="radio"
                    name={`quiz-${step.id}`}
                    value={opt.value}
                    checked={selected}
                    onChange={() => choose(opt.value)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-mono',
                      selected ? 'border-accent bg-accent text-on-accent' : 'border-line text-txt-2',
                    )}
                  >
                    {LETTERS[i] ?? i + 1}
                  </span>
                  <span className="flex-1 text-body font-medium text-txt">
                    {opt.label}
                    {opt.hint && (
                      <span className="block text-small font-normal text-txt-2">{opt.hint}</span>
                    )}
                  </span>
                  {selected && (
                    <Check className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  )}
                </motion.label>
              )
            })}
          </div>
        )}
      </fieldset>

      {/* Navegação inferior — sempre visível (fallback sem auto-avanço) */}
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={!canBack}
          className={cn(
            'inline-flex min-h-[44px] items-center gap-2 rounded-btn px-4 text-small font-medium text-txt-2 transition-colors hover:text-txt',
            !canBack && 'invisible',
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!value}
          className={cn(
            'inline-flex min-h-[48px] items-center gap-2 rounded-btn px-6 font-bold transition-all',
            value
              ? 'bg-accent text-on-accent hover:bg-accent-hover active:scale-[0.98]'
              : 'cursor-not-allowed border border-line text-txt-2 opacity-50',
          )}
        >
          Continuar
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-3 text-center text-small text-txt-2" aria-hidden="true">
        Enter avança · setas trocam a opção · Backspace volta
      </p>
    </motion.div>
  )
}

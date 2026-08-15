import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldCheck, Lock, FileCheck2, MessageCircle, LogOut } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import type { EligibilityResult } from '@contracts/constants'
import { WHATSAPP_URL } from '@/lib/constants'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { visibleSteps, buildQuizAnswers, type QuizRecord } from '@/components/quiz/tree'
import QuestionStep from '@/components/quiz/QuestionStep'
import ContactStep, { type ContactData } from '@/components/quiz/ContactStep'
import ResultView from '@/components/quiz/ResultView'
import { saveContact, maskWhatsapp } from '@/components/simulador/helpers'

const SAVE_KEY = 'isentapcd:quiz-v1'

interface QuizSave {
  answers: QuizRecord
  stepIndex: number
  savedAt: number
}

function loadSave(): QuizSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as QuizSave
    if (!parsed.answers || typeof parsed.stepIndex !== 'number') return null
    if (Object.keys(parsed.answers).length === 0) return null
    return parsed
  } catch {
    return null
  }
}

type Phase = 'intro' | 'quiz' | 'result'

/**
 * /pre-analise — Quiz de elegibilidade estilo Typeform (quiz.md): ~15 perguntas
 * condicionais, uma por tela, navegável por teclado, autosave em localStorage com
 * recuperação de abandono, resultado elegível/pendências/não elegível via
 * trpc.quiz.submit (cria o lead).
 */
export default function PreAnalise() {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const submit = trpc.quiz.submit.useMutation()

  const [phase, setPhase] = useState<Phase>('intro')
  const [answers, setAnswers] = useState<QuizRecord>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [saved, setSaved] = useState<QuizSave | null>(() => loadSave())
  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)

  const steps = useMemo(() => visibleSteps(answers), [answers])
  const clampedIndex = Math.min(stepIndex, steps.length - 1)
  const step = steps[clampedIndex]

  // Autosave (recuperação de abandono)
  useEffect(() => {
    if (phase !== 'quiz') return
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({ answers, stepIndex: clampedIndex, savedAt: Date.now() } satisfies QuizSave),
      )
    } catch {
      /* storage indisponível */
    }
  }, [answers, clampedIndex, phase])

  // SEO (quiz.md): página de fluxo, noindex
  useEffect(() => {
    document.title = 'Pré-análise gratuita de elegibilidade — IsentaPCD'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex,follow'
    document.head.appendChild(meta)
    return () => {
      document.title = 'IsentaPCD'
      meta.remove()
    }
  }, [])

  function start(fresh: boolean) {
    if (fresh) {
      setAnswers({})
      setStepIndex(0)
      try {
        localStorage.removeItem(SAVE_KEY)
      } catch {
        /* noop */
      }
    } else if (saved) {
      setAnswers(saved.answers)
      setStepIndex(saved.stepIndex)
    }
    setSaved(null)
    setPhase('quiz')
  }

  function handleAnswer(stepId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [stepId]: value }))
  }

  function goNext() {
    if (clampedIndex < steps.length - 1) setStepIndex(clampedIndex + 1)
  }
  function goBack() {
    if (clampedIndex > 0) setStepIndex(clampedIndex - 1)
  }

  async function handleContact(c: ContactData) {
    const quizAnswers = buildQuizAnswers(answers)
    if (!quizAnswers) return
    try {
      const res = await submit.mutateAsync({
        answers: quizAnswers,
        contato: {
          name: c.name,
          whatsapp: c.whatsapp,
          lgpdConsent: true,
          referredBy: c.referredBy || undefined,
        },
      })
      saveContact({
        name: c.name,
        whatsapp: maskWhatsapp(c.whatsapp),
        referredBy: c.referredBy || undefined,
      })
      setResult(res.result)
      setPhase('result')
      try {
        localStorage.removeItem(SAVE_KEY)
      } catch {
        /* noop */
      }
    } catch {
      /* erro exibido pelo ContactStep via submit.error */
    }
  }

  function handleExit() {
    if (!confirmExit && phase === 'quiz') {
      setConfirmExit(true)
      return
    }
    navigate('/')
  }

  const progressPct =
    phase === 'quiz' ? Math.round(((clampedIndex + 1) / steps.length) * 100) : 0

  return (
    <div className="min-h-[80dvh] bg-bg text-txt">
      {/* Barra de imersão do quiz: progresso + sair (quiz.md) */}
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 pt-6">
        <div
          className="h-1 flex-1 overflow-hidden rounded-full bg-paper-50/20"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-label={`Progresso da pré-análise: ${progressPct}%`}
        >
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={false}
            animate={{ width: `${phase === 'quiz' ? progressPct : 0}%` }}
            transition={
              reduced ? { duration: 0 } : { type: 'spring', stiffness: 170, damping: 26 }
            }
          />
        </div>
        <p className="sr-only" aria-live="polite">
          {phase === 'quiz'
            ? `Pergunta ${clampedIndex + 1} de aproximadamente ${steps.length}`
            : ''}
        </p>
        {phase !== 'result' && (
          <div className="relative">
            <button
              type="button"
              onClick={handleExit}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-4 text-small font-medium text-txt-2 transition-colors hover:text-txt"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </button>
            {confirmExit && phase === 'quiz' && (
              <div
                role="alertdialog"
                aria-label="Confirmar saída"
                className="absolute right-0 top-full z-30 mt-2 w-64 rounded-input border border-line bg-surface p-4 shadow-card-light"
              >
                <p className="text-small text-txt">
                  Sair da pré-análise? Suas respostas ficam salvas neste navegador.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="min-h-[44px] flex-1 rounded-btn bg-danger/20 px-3 text-small font-bold text-danger"
                  >
                    Sair
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmExit(false)}
                    className="min-h-[44px] flex-1 rounded-btn bg-accent px-3 text-small font-bold text-on-accent"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto flex max-w-3xl flex-col px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Q0 — Tela de abertura */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.15 : 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <motion.img
                src="/quiz-illustration.png"
                alt="Pessoa sentada numa poltrona respondendo a um tablet, com um gato no colo — dá para fazer de casa, no sofá."
                width={420}
                height={420}
                className="w-full max-w-[420px] rounded-card"
                initial={reduced ? false : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
              <h1 className="mt-8 max-w-[22ch] font-display text-h1 font-medium [text-wrap:balance]">
                Descubra em 2 minutos se você tem direito.
              </h1>
              <p className="mt-4 max-w-prose68 text-lead text-txt-2">
                Perguntas simples, sem juridiquês. No final, você recebe seu resultado e o que
                fazer em seguida — de graça.
              </p>
              <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Garantias">
                {[
                  { icon: <FileCheck2 className="h-4 w-4" aria-hidden="true" />, label: 'Grátis' },
                  { icon: <Lock className="h-4 w-4" aria-hidden="true" />, label: 'Sem senha do Gov.br' },
                  {
                    icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
                    label: 'Seus dados são seus (LGPD)',
                  },
                ].map((c) => (
                  <li
                    key={c.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-small text-txt"
                  >
                    {c.icon}
                    {c.label}
                  </li>
                ))}
              </ul>

              {/* Recuperação de abandono */}
              {saved && (
                <div
                  role="status"
                  className="mt-6 w-full max-w-md rounded-card border border-accent/40 bg-surface p-4"
                >
                  <p className="text-small text-txt">
                    Você já começou — continuar de onde parou?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => start(false)}
                      className="min-h-[44px] flex-1 rounded-btn bg-accent px-4 text-small font-bold text-on-accent"
                    >
                      Continuar de onde parou
                    </button>
                    <button
                      type="button"
                      onClick={() => start(true)}
                      className="min-h-[44px] flex-1 rounded-btn border border-line px-4 text-small font-medium text-txt-2 hover:text-txt"
                    >
                      Recomeçar
                    </button>
                  </div>
                </div>
              )}

              {!saved && (
                <button
                  type="button"
                  onClick={() => start(true)}
                  className={cn(
                    'mt-8 inline-flex min-h-[56px] items-center justify-center rounded-btn bg-accent px-8 text-body font-bold text-on-accent transition-all hover:bg-accent-hover active:scale-[0.98]',
                    !reduced && 'animate-[breathe_3s_ease-in-out_infinite]',
                  )}
                >
                  Começar
                </button>
              )}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-small text-txt-2 underline underline-offset-4 hover:text-txt"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Prefiro falar com uma pessoa no WhatsApp
              </a>
            </motion.div>
          )}

          {/* Q1 — Perguntas */}
          {phase === 'quiz' && step && step.kind !== 'contact' && (
            <QuestionStep
              key={step.id}
              step={step}
              value={answers[step.id]}
              onAnswer={handleAnswer}
              onNext={goNext}
              onBack={goBack}
              canBack={clampedIndex > 0}
            />
          )}
          {phase === 'quiz' && step && step.kind === 'contact' && (
            <ContactStep
              key="contato"
              pending={submit.isPending}
              submitError={
                submit.isError
                  ? 'Não foi possível enviar agora. Confira sua conexão e tente de novo.'
                  : null
              }
              onSubmit={handleContact}
              onBack={goBack}
            />
          )}

          {/* Q2 — Resultado */}
          {phase === 'result' && result && <ResultView key="resultado" result={result} answers={answers} />}
        </AnimatePresence>
      </div>
    </div>
  )
}

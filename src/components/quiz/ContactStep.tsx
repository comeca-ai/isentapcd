import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Send } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  loadContact,
  maskWhatsapp,
  whatsappError,
} from '@/components/simulador/helpers'

export interface ContactData {
  name: string
  whatsapp: string
  referredBy: string
  lgpd: boolean
}

interface ContactStepProps {
  pending: boolean
  submitError: string | null
  onSubmit: (c: ContactData) => void
  onBack: () => void
}

/**
 * Q15 — etapa final do quiz: nome + WhatsApp (+ "Quem te indicou?" opcional)
 * + consentimento LGPD. Erros descritivos com foco movido ao campo (quiz.md a11y).
 */
export default function ContactStep({ pending, submitError, onSubmit, onBack }: ContactStepProps) {
  const reduced = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const waRef = useRef<HTMLInputElement>(null)
  const lgpdRef = useRef<HTMLInputElement>(null)

  // Pré-preenche com o contato salvo (simulador) — inicialização lazy, sem efeito
  const [name, setName] = useState(() => loadContact()?.name ?? '')
  const [whatsapp, setWhatsapp] = useState(() => loadContact()?.whatsapp ?? '')
  const [referredBy, setReferredBy] = useState(() => loadContact()?.referredBy ?? '')
  const [lgpd, setLgpd] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; whatsapp?: string; lgpd?: string }>({})

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Informe como podemos te chamar (pelo menos 2 letras).'
    const waErr = whatsappError(whatsapp)
    if (waErr) next.whatsapp = waErr
    if (!lgpd) next.lgpd = 'É preciso aceitar o uso dos dados (LGPD) para receber o resultado.'
    setErrors(next)
    if (next.name) {
      nameRef.current?.focus()
      return
    }
    if (next.whatsapp) {
      waRef.current?.focus()
      return
    }
    if (next.lgpd) {
      lgpdRef.current?.focus()
      return
    }
    onSubmit({ name: name.trim(), whatsapp: whatsapp.replace(/\D/g, ''), referredBy: referredBy.trim(), lgpd })
  }

  const inputClass =
    'h-[52px] w-full rounded-input border-[1.5px] border-line bg-surface px-4 text-body text-txt outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30'
  const errorClass = 'mt-1 flex items-start gap-1.5 text-small font-medium text-danger'

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -32 }}
      transition={reduced ? { duration: 0.15 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex w-full max-w-xl flex-col"
    >
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-center font-display text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-tight outline-none [text-wrap:balance]"
      >
        Para onde enviamos seu resultado completo?
      </h2>
      <p className="mt-2 text-center text-small text-txt-2">
        Chega no seu WhatsApp em instantes — com os próximos passos do seu caso.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        {submitError && (
          <div
            role="alert"
            className="rounded-input border border-danger/40 bg-danger/10 px-4 py-3 text-small font-medium text-danger"
          >
            {submitError}
          </div>
        )}

        <div>
          <label htmlFor="quiz-nome" className="mb-1 block text-small font-bold">
            Como podemos te chamar?
          </label>
          <input
            ref={nameRef}
            id="quiz-nome"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'quiz-nome-erro' : undefined}
            className={inputClass}
            placeholder="Seu nome ou apelido"
          />
          {errors.name && (
            <p id="quiz-nome-erro" role="alert" className={errorClass}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="quiz-wa" className="mb-1 block text-small font-bold">
            WhatsApp
          </label>
          <p className="mb-1 text-small text-txt-2">Enviamos o resultado por aqui — nada de spam.</p>
          <input
            ref={waRef}
            id="quiz-wa"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
            aria-invalid={Boolean(errors.whatsapp)}
            aria-describedby={errors.whatsapp ? 'quiz-wa-erro' : undefined}
            className={inputClass}
            placeholder="(11) 98765-4321"
          />
          {errors.whatsapp && (
            <p id="quiz-wa-erro" role="alert" className={errorClass}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {errors.whatsapp}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="quiz-ref" className="mb-1 block text-small font-bold">
            Quem te indicou? <span className="font-normal text-txt-2">(opcional)</span>
          </label>
          <input
            id="quiz-ref"
            type="text"
            value={referredBy}
            onChange={(e) => setReferredBy(e.target.value)}
            className={inputClass}
            placeholder="Nome ou código de quem indicou"
          />
        </div>

        <div>
          <div className="flex items-start gap-3">
            <input
              ref={lgpdRef}
              id="quiz-lgpd"
              type="checkbox"
              checked={lgpd}
              onChange={(e) => setLgpd(e.target.checked)}
              aria-invalid={Boolean(errors.lgpd)}
              aria-describedby={errors.lgpd ? 'quiz-lgpd-erro' : undefined}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-amber-400"
            />
            <label htmlFor="quiz-lgpd" className="text-small text-txt">
              Aceito receber meu resultado e conteúdos do IsentaPCD. Posso sair quando quiser.
            </label>
          </div>
          {errors.lgpd && (
            <p id="quiz-lgpd-erro" role="alert" className={errorClass}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {errors.lgpd}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-btn px-4 text-small font-medium text-txt-2 transition-colors hover:text-txt"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-accent px-6 font-bold text-on-accent transition-all hover:bg-accent-hover hover:shadow-amber-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Analisando…' : 'Ver meu resultado'}
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </motion.div>
  )
}

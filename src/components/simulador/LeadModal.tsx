import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Map, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import type { Uf } from '@contracts/constants'
import { formatBRL } from '@/lib/constants'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  loadContact,
  saveContact,
  maskWhatsapp,
  whatsappError,
} from './helpers'

interface LeadModalProps {
  open: boolean
  onClose: () => void
  uf: Uf
  total: number | null
  vehicleSlug: string | null
  /** Chamado após captura bem-sucedida (desliga os gatilhos automáticos). */
  onCaptured?: () => void
}

/** Confete discreto de 12 partículas âmbar/musgo (off em reduced motion). */
function Confetti() {
  const reduced = useReducedMotion()
  if (reduced) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute block h-2 w-2 rounded-full"
          style={{
            left: `${8 + i * 7.5}%`,
            background: i % 2 === 0 ? 'var(--accent)' : 'var(--success)',
          }}
          initial={{ y: -12, opacity: 1 }}
          animate={{ y: 140, opacity: 0 }}
          transition={{ duration: 1.1, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  )
}

const inputClass =
  'h-[52px] w-full rounded-input border-[1.5px] border-line bg-surface px-4 text-body text-txt outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30'
const errorClass = 'mt-1 flex items-start gap-1.5 text-small font-medium text-danger'

interface DialogContentProps {
  onClose: () => void
  uf: Uf
  total: number | null
  vehicleSlug: string | null
  onCaptured?: () => void
}

/** Conteúdo do modal — remontado a cada abertura (estado fresco + pré-preenchimento). */
function DialogContent({ onClose, uf, total, vehicleSlug, onCaptured }: DialogContentProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const capture = trpc.leads.capture.useMutation()

  const [name, setName] = useState(() => loadContact()?.name ?? '')
  const [whatsapp, setWhatsapp] = useState(() => loadContact()?.whatsapp ?? '')
  const [referredBy, setReferredBy] = useState(() => loadContact()?.referredBy ?? '')
  const [lgpd, setLgpd] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; whatsapp?: string; lgpd?: string }>({})
  const [done, setDone] = useState(false)

  // Focus trap + ESC (design.md §9.2)
  useEffect(() => {
    if (!dialogRef.current) return
    const container = dialogRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
    focusables()[0]?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Informe como podemos te chamar (pelo menos 2 letras).'
    const waError = whatsappError(whatsapp)
    if (waError) next.whatsapp = waError
    if (!lgpd) next.lgpd = 'É preciso aceitar o uso dos dados (LGPD) para receber o mapa.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    try {
      await capture.mutateAsync({
        name: name.trim(),
        whatsapp: whatsapp.replace(/\D/g, ''),
        lgpdConsent: true,
        referredBy: referredBy.trim() || undefined,
        uf,
        vehicleSlug: vehicleSlug ?? undefined,
      })
      saveContact({
        name: name.trim(),
        whatsapp: maskWhatsapp(whatsapp),
        referredBy: referredBy.trim() || undefined,
      })
      setDone(true)
      onCaptured?.()
    } catch (err) {
      setErrors({
        name: err instanceof Error ? err.message : 'Não foi possível enviar. Tente de novo.',
      })
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        aria-label="Fechar — voltar ao simulador"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-950/80 backdrop-blur-sm"
        tabIndex={-1}
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[520px] rounded-card border border-line bg-bg p-6 shadow-2xl sm:p-8"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-btn border border-line text-txt transition-colors hover:border-accent/50"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {done ? (
          <div className="relative pt-2 text-center" aria-live="polite">
            <Confetti />
            <motion.span
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </motion.span>
            <h3 className="mt-4 font-display text-h3 font-medium">
              Mapa enviado! Chegou no seu WhatsApp em instantes.
            </h3>
            <p className="mt-2 text-body text-txt-2">
              Guarde o link da conversa — seu mapa de {uf} fica disponível lá.
            </p>
            <Link
              to="/pre-analise"
              className="mt-6 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-accent px-6 font-bold text-on-accent transition-all hover:bg-accent-hover active:scale-[0.98]"
            >
              Fazer a pré-análise completa
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            <p className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Map className="h-6 w-6" aria-hidden="true" />
            </p>
            <h3 id={titleId} className="mt-4 font-display text-h3 font-medium">
              Seu mapa de {uf} está pronto
            </h3>
            <ul className="mt-3 space-y-1 font-mono text-mono text-txt-2" aria-label="O que você vai receber">
              <li>· Regras de {uf} (ICMS + IPVA) com fontes</li>
              <li>
                · Sua economia estimada{total !== null ? `: ${formatBRL(total)}` : ''}
              </li>
              <li>· Checklist de documentos do seu perfil</li>
            </ul>

            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
              <div>
                <label htmlFor="lead-nome" className="mb-1 block text-small font-bold">
                  Como podemos te chamar?
                </label>
                <input
                  id="lead-nome"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'lead-nome-erro' : undefined}
                  className={inputClass}
                  placeholder="Seu nome ou apelido"
                />
                {errors.name && (
                  <p id="lead-nome-erro" role="alert" className={errorClass}>
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lead-wa" className="mb-1 block text-small font-bold">
                  WhatsApp
                </label>
                <p className="mb-1 text-small text-txt-2">
                  Enviamos o mapa por aqui — nada de spam.
                </p>
                <input
                  id="lead-wa"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
                  aria-invalid={Boolean(errors.whatsapp)}
                  aria-describedby={errors.whatsapp ? 'lead-wa-erro' : undefined}
                  className={inputClass}
                  placeholder="(11) 98765-4321"
                />
                {errors.whatsapp && (
                  <p id="lead-wa-erro" role="alert" className={errorClass}>
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {errors.whatsapp}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lead-ref" className="mb-1 block text-small font-bold">
                  Quem te indicou? <span className="font-normal text-txt-2">(opcional)</span>
                </label>
                <input
                  id="lead-ref"
                  type="text"
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value)}
                  className={inputClass}
                  placeholder="Nome ou código de quem indicou"
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="lead-lgpd"
                  type="checkbox"
                  checked={lgpd}
                  onChange={(e) => setLgpd(e.target.checked)}
                  aria-invalid={Boolean(errors.lgpd)}
                  aria-describedby={errors.lgpd ? 'lead-lgpd-erro' : undefined}
                  className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-amber-400"
                />
                <label htmlFor="lead-lgpd" className="text-small text-txt">
                  Aceito receber meu mapa e conteúdos do IsentaPCD. Posso sair quando quiser.
                </label>
              </div>
              {errors.lgpd && (
                <p id="lead-lgpd-erro" role="alert" className={errorClass}>
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {errors.lgpd}
                </p>
              )}

              <button
                type="submit"
                disabled={capture.isPending}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-accent px-6 font-bold text-on-accent transition-all hover:bg-accent-hover hover:shadow-amber-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {capture.isPending ? 'Enviando…' : 'Enviar meu mapa'}
              </button>
              <p className="text-center text-small text-txt-2">
                Sem pagamento nesta etapa. Sempre.
              </p>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

/**
 * Modal de captura de lead "Seu mapa está pronto" (simulador.md SM4):
 * nome + WhatsApp + consentimento LGPD + "Quem te indicou?" (opcional),
 * focus trap, ESC fecha, estado de sucesso inline.
 */
export default function LeadModal({ open, onClose, uf, total, vehicleSlug, onCaptured }: LeadModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <DialogContent
          onClose={onClose}
          uf={uf}
          total={total}
          vehicleSlug={vehicleSlug}
          onCaptured={onCaptured}
        />
      )}
    </AnimatePresence>
  )
}

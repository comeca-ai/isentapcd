import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import type { Uf } from '@contracts/constants'

interface LeadCaptureProps {
  uf: Uf
  /** Rótulo do botão, ex.: "Receber o mapa completo de SP". */
  cta: string
}

/**
 * Captura de lead (nome + WhatsApp + consentimento LGPD) via trpc.leads.capture.
 * Usada no painel "por estado" do guia.
 */
export default function LeadCapture({ uf, cta }: LeadCaptureProps) {
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const mutation = trpc.leads.capture.useMutation()

  if (mutation.isSuccess) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-card border border-success/50 bg-success/[.07] p-4"
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
        <p className="text-small text-txt">
          Recebido! Vamos te chamar no WhatsApp com o mapa completo de {uf} — regras, prazos e
          links oficiais.
        </p>
      </div>
    )
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const errs: string[] = []
    if (name.trim().length < 2) errs.push('Informe seu nome.')
    if (whatsapp.trim().length < 8) errs.push('Informe um WhatsApp válido com DDD.')
    if (!consent) errs.push('É preciso aceitar o uso dos dados (LGPD) para continuar.')
    setErrors(errs)
    if (errs.length > 0) return
    mutation.mutate({ name: name.trim(), whatsapp: whatsapp.trim(), lgpdConsent: true, uf })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-card border border-line bg-bg p-4">
      <p className="text-small font-medium text-txt">{cta}</p>
      {errors.length > 0 && (
        <div role="alert" className="mt-3 rounded-input border border-danger/50 bg-danger/[.07] p-3">
          <ul className="list-inside list-disc text-small text-danger">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`lead-nome-${uf}`} className="block text-small text-txt-2">
            Nome
          </label>
          <input
            id={`lead-nome-${uf}`}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-input border border-line bg-surface px-3 text-body text-txt"
          />
        </div>
        <div>
          <label htmlFor={`lead-zap-${uf}`} className="block text-small text-txt-2">
            WhatsApp com DDD
          </label>
          <input
            id={`lead-zap-${uf}`}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="(11) 90000-0000"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-input border border-line bg-surface px-3 text-body text-txt"
          />
        </div>
      </div>
      <label className="mt-3 flex items-start gap-2 text-small text-txt-2">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[#F2B53F]"
        />
        Aceito que o IsentaPCD use esses dados para me contatar sobre as isenções (LGPD).
      </label>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-btn bg-accent px-5 text-small font-bold text-on-accent transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
      >
        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {cta} →
      </button>
      {mutation.isError && (
        <p role="alert" className="mt-2 text-small text-danger">
          Não conseguimos enviar agora. Tente de novo ou fale com a gente no WhatsApp.
        </p>
      )}
    </form>
  )
}

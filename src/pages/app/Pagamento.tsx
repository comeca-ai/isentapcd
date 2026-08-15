import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  Lock,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import AppShell from '@/components/app/AppShell'
import { useNow } from '@/components/app/useNow'
import { trpc } from '@/providers/trpc'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { formatBRL, WHATSAPP_NUMBER } from '@/lib/constants'
import { PAYWALL_ENABLED, PRICE_EXECUTION } from '@contracts/constants'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const WHATSAPP_PAY_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Olá! Quero desbloquear o acompanhamento completo do IsentaPCD (R$ 497, pagamento único). Pode gerar meu Pix e tirar minhas dúvidas?',
)}`

const DESTRAVA = [
  'Revisão humana de todos os documentos (resposta em até 1 dia útil)',
  'Checklist completo por órgão (Receita + Sefaz do seu estado + família)',
  'Passo a passo assistido do IPI e do ICMS, com textos prontos',
  'Alertas automáticos de prazos (270/180 dias) e carências (2/4 anos)',
  'Suporte humano no WhatsApp até a nota fiscal — e depois',
  'Upload ilimitado de documentos',
] as const

/** Pagamento / Paywall (/app/pagamento) — modo claro (app-pagamento.md). */
export default function Pagamento() {
  const reduced = useReducedMotion()
  const status = trpc.payments.status.useQuery(undefined, { retry: false })

  const paidAt = status.data?.paidAt ? new Date(status.data.paidAt) : null
  const paywallEnabled = status.data?.paywallEnabled ?? PAYWALL_ENABLED
  const finalPrice = status.data?.finalPrice ?? PRICE_EXECUTION
  const referralDiscount = status.data?.referralDiscount ?? 0

  const fade = (i: number) =>
    ({
      initial: reduced ? false : { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: reduced ? 0 : 0.5, ease: EASE, delay: reduced ? 0 : i * 0.1 },
    }) as const

  return (
    <AppShell>
      <div className="mx-auto max-w-[1080px]">
        {status.isLoading && (
          <p role="status" className="py-16 text-center text-body text-txt-2">
            Carregando status do seu plano…
          </p>
        )}

        {status.isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-4 rounded-card border border-danger/40 bg-danger/5 p-6"
          >
            <AlertTriangle className="h-6 w-6 shrink-0 text-danger" aria-hidden="true" />
            <p className="flex-1 text-body font-medium text-txt">
              Não conseguimos carregar o status do pagamento.
            </p>
            <button
              type="button"
              onClick={() => void status.refetch()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-4 text-small font-bold text-on-accent hover:bg-accent-hover"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Tentar de novo
            </button>
          </div>
        )}

        {status.data && paidAt && <PaidState paidAt={paidAt} reduced={reduced} />}

        {/* POC: paywall desligado — nada a pagar, execução assistida liberada */}
        {status.data && !paidAt && !paywallEnabled && <PocFreeState reduced={reduced} />}

        {status.data && !paidAt && paywallEnabled && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_5fr]">
            {/* Coluna oferta */}
            <motion.div {...fade(0)}>
              <h1 className="font-display text-h2 font-medium">
                Destrave seu processo inteiro por {formatBRL(finalPrice)} — uma vez só.
              </h1>
              <p className="mt-3 text-lead text-txt-2">
                Sem mensalidade. Cobre seu caso do protocolo à nota fiscal — e os lembretes de
                carência pelos próximos 4 anos.
              </p>

              <section aria-labelledby="pag-destrava" className="mt-8">
                <h2 id="pag-destrava" className="text-h3 font-medium">
                  O que destrava
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {DESTRAVA.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-body text-txt">
                      <Check
                        className="mt-1 h-5 w-5 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Comparativo honesto grátis × completo */}
              <section aria-labelledby="pag-comparativo" className="mt-8">
                <h2 id="pag-comparativo" className="text-h3 font-medium">
                  Grátis × Completo, sem letra miúda
                </h2>
                <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface shadow-card-light">
                  <table className="w-full min-w-[420px] text-left text-small">
                    <caption className="sr-only">
                      Comparativo entre o plano gratuito e o acompanhamento completo
                    </caption>
                    <thead>
                      <tr className="border-b border-line">
                        <th scope="col" className="px-4 py-3 font-bold text-txt">
                          O que você recebe
                        </th>
                        <th scope="col" className="px-4 py-3 font-bold text-txt">
                          Grátis
                        </th>
                        <th scope="col" className="px-4 py-3 font-bold text-txt">
                          Completo ({formatBRL(PRICE_EXECUTION)})
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-txt-2">
                      <tr className="border-b border-line">
                        <th scope="row" className="px-4 py-3 font-medium text-txt">
                          Pré-análise e mapa da sua UF
                        </th>
                        <td className="px-4 py-3">Sim</td>
                        <td className="px-4 py-3">Sim</td>
                      </tr>
                      <tr className="border-b border-line">
                        <th scope="row" className="px-4 py-3 font-medium text-txt">
                          Revisão humana de documentos
                        </th>
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">Sim, em até 1 dia útil</td>
                      </tr>
                      <tr className="border-b border-line">
                        <th scope="row" className="px-4 py-3 font-medium text-txt">
                          Passo a passo assistido de IPI e ICMS
                        </th>
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">Sim</td>
                      </tr>
                      <tr className="border-b border-line">
                        <th scope="row" className="px-4 py-3 font-medium text-txt">
                          Alertas de prazos e carências
                        </th>
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">Sim, automáticos</td>
                      </tr>
                      <tr>
                        <th scope="row" className="px-4 py-3 font-medium text-txt">
                          Suporte no WhatsApp até a nota fiscal
                        </th>
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">Sim, com humanos</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Selo de risco zero — art. 49 CDC em linguagem simples */}
              <section
                aria-labelledby="pag-garantia"
                className="mt-8 rounded-card border border-success/40 bg-success/5 p-6"
              >
                <h2 id="pag-garantia" className="flex items-center gap-2 text-h3 font-medium">
                  <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
                  Risco zero, por lei
                </h2>
                <p className="mt-2 text-body text-txt">
                  Você tem <strong>7 dias de garantia incondicional</strong> — é o artigo 49 do
                  Código de Defesa do Consumidor. Se desistir, devolvemos 100% do valor, sem
                  perguntas e sem burocracia.
                </p>
                <p className="mt-2 text-small text-txt-2">
                  Transparência importante: quem defere a isenção é sempre o órgão público. Nosso
                  trabalho é você chegar lá sem erro.
                </p>
              </section>
            </motion.div>

            {/* Coluna checkout (card sticky) */}
            <motion.aside {...fade(1)} aria-label="Resumo do pagamento" className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-card border border-line bg-surface p-6 shadow-card-light">
                <img
                  src="/paywall-lock.svg"
                  alt=""
                  className="mx-auto h-20 w-20"
                />
                <h2 className="mt-4 text-center text-h3 font-medium">
                  Para executarmos os protocolos
                </h2>
                <p className="mt-1 text-center text-small text-txt-2">
                  Acompanhamento completo IsentaPCD · pagamento único
                </p>

                <p className="mt-4 text-center">
                  {referralDiscount > 0 && (
                    <span className="mr-2 align-middle font-mono text-lead text-txt-2 line-through">
                      {formatBRL(PRICE_EXECUTION)}
                    </span>
                  )}
                  <PriceNumber value={finalPrice} reduced={reduced} />
                </p>
                {referralDiscount > 0 && (
                  <p className="mt-1 text-center text-small font-bold text-success">
                    Desconto de indicação aplicado: −{formatBRL(referralDiscount)}
                  </p>
                )}

                <a
                  href={WHATSAPP_PAY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-btn bg-whatsapp-light px-5 text-body font-bold text-white transition-colors hover:bg-whatsapp-dark active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  Pagar pelo WhatsApp (Pix)
                </a>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-small text-txt-2">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Pagamento seguro · confirmação humana
                </p>

                {/* Como funciona a confirmação manual */}
                <div className="mt-6 rounded-input border border-line bg-bg-alt p-4">
                  <h3 className="flex items-center gap-2 text-small font-bold text-txt">
                    <Clock className="h-4 w-4 text-txt-2" aria-hidden="true" />
                    Como funciona a confirmação
                  </h3>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-small text-txt-2">
                    <li>Você chama no WhatsApp e paga via Pix.</li>
                    <li>Nosso time confirma o pagamento manualmente (em horário comercial).</li>
                    <li>Seu painel desbloqueia na hora e você recebe a confirmação por e-mail.</li>
                  </ol>
                </div>

                <p className="mt-4 text-center text-small text-txt-2">
                  Prefere conversar antes? O mesmo botão acima abre uma conversa — tiramos dúvidas
                  e, se quiser, geramos seu Pix por lá.
                </p>
              </div>
            </motion.aside>
          </div>
        )}
      </div>
    </AppShell>
  )
}

// ── Número do preço com contagem (600ms; instantâneo em reduced motion) ────

function PriceNumber({ value, reduced }: { value: number; reduced: boolean }) {
  const [shown, setShown] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    if (reduced) return // reduced motion: valor final direto (sem contagem)
    const start = performance.now()
    const dur = 600
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      // ease-out cúbico
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, reduced])

  return (
    <span className="tnum align-middle font-mono text-[2.5rem] font-semibold leading-none text-txt">
      {formatBRL(reduced ? value : shown)}
    </span>
  )
}

// ── Estado POC (paywall off) ───────────────────────────────────────────────

function PocFreeState({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: EASE }}
      className="mx-auto max-w-[720px]"
    >
      <div className="rounded-card border border-success/40 bg-success/5 p-8 text-center shadow-card-light">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-9 w-9 text-success" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-h2 font-medium">
          Execução assistida liberada na POC
        </h1>
        <p className="mt-2 text-lead text-txt-2">
          Durante a prova de conceito, tudo é grátis — nada a pagar por aqui.
        </p>
        <ul className="mx-auto mt-6 flex max-w-md flex-col gap-3 text-left">
          {DESTRAVA.map((item) => (
            <li key={item} className="flex items-start gap-3 text-body text-txt">
              <Check className="mt-1 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/app/documentos"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-accent px-6 text-body font-bold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.98]"
          >
            <UploadCloud className="h-5 w-5" aria-hidden="true" />
            Enviar documentos
          </Link>
          <Link
            to="/app"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-btn border border-line px-6 text-body font-bold text-txt transition-colors hover:bg-bg-alt"
          >
            Voltar ao painel
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-6 text-small text-txt-2">
          Quando a POC terminar, avisamos com antecedência antes de qualquer cobrança.
        </p>
      </div>
    </motion.div>
  )
}

// ── Estado pago (app-pagamento.md P3) ──────────────────────────────────────

function PaidState({ paidAt, reduced }: { paidAt: Date; reduced: boolean }) {
  const now = useNow()
  // Garantia art. 49 CDC: 7 dias corridos a partir da confirmação
  const garantiaFim = new Date(paidAt)
  garantiaFim.setDate(garantiaFim.getDate() + 7)
  const diasGarantia = Math.max(0, Math.ceil((garantiaFim.getTime() - now) / 86_400_000))

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: EASE }}
      className="mx-auto max-w-[720px]"
    >
      <div className="rounded-card border border-success/40 bg-success/5 p-8 text-center shadow-card-light">
        <motion.span
          initial={reduced ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.4, ease: EASE }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15"
        >
          <CheckCircle2 className="h-9 w-9 text-success" aria-hidden="true" />
        </motion.span>
        <h1 className="mt-4 font-display text-h2 font-medium">Pagamento confirmado</h1>
        <p className="mt-2 text-lead text-txt-2">
          Desbloqueado! Seu acompanhamento completo está ativo.
        </p>

        <dl className="mx-auto mt-6 grid max-w-md grid-cols-1 gap-4 text-left sm:grid-cols-2">
          <div className="rounded-input border border-line bg-surface p-4">
            <dt className="flex items-center gap-1.5 text-small text-txt-2">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              Confirmado em
            </dt>
            <dd className="tnum mt-1 font-mono text-mono font-semibold text-txt">
              {paidAt.toLocaleDateString('pt-BR')}
            </dd>
          </div>
          <div className="rounded-input border border-line bg-surface p-4">
            <dt className="flex items-center gap-1.5 text-small text-txt-2">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Garantia (art. 49 CDC)
            </dt>
            <dd className="mt-1 text-small font-bold text-txt">
              {diasGarantia > 0
                ? `${diasGarantia} ${diasGarantia === 1 ? 'dia restante' : 'dias restantes'} para desistir`
                : 'Período de desistência encerrado'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/app"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-accent px-6 text-body font-bold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.98]"
          >
            Bora organizar seus documentos
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            to="/app/documentos"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-btn border border-line px-6 text-body font-bold text-txt transition-colors hover:bg-bg-alt"
          >
            <UploadCloud className="h-5 w-5" aria-hidden="true" />
            Enviar documentos
          </Link>
        </div>

        <p className="mt-6 text-small text-txt-2">
          <FileCheck className="mr-1 inline h-4 w-4 align-[-2px]" aria-hidden="true" />
          Você também recebeu a confirmação por e-mail. Precisa de ajuda com o pagamento?{' '}
          <a
            href={WHATSAPP_PAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-accent underline underline-offset-4 hover:text-accent-hover"
          >
            Fale com a gente no WhatsApp
          </a>
          .
        </p>
      </div>
    </motion.div>
  )
}

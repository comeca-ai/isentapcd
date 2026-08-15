import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Lock } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { PRICE_EXECUTION } from '@contracts/constants'

/**
 * Guard de paywall: consome stages.timeline e exibe cadeado visual quando a
 * etapa é postGate e o processo ainda não foi pago.
 */
export function StageGate({ stageKey, children }: { stageKey: string; children: ReactNode }) {
  const timeline = trpc.stages.timeline.useQuery(undefined, { retry: false })

  if (timeline.isLoading) {
    return (
      <div className="rounded-card border border-line bg-surface p-6" role="status">
        <span className="text-small text-txt-2">Carregando etapa…</span>
      </div>
    )
  }
  const stage = timeline.data?.stages.find((s) => s.key === stageKey)
  const locked = stage ? stage.locked : false

  if (!locked) return <>{children}</>

  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-surface">
      <div className="pointer-events-none select-none p-6 opacity-60 blur-[3px]" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/60 p-6 text-center">
        <img src="/paywall-lock.svg" alt="" className="h-20 w-20" />
        <p className="text-body font-bold">Disponível no acompanhamento completo</p>
        <p className="max-w-sm text-small text-txt-2">
          Desbloqueie esta etapa e todas as seguintes por R$ {PRICE_EXECUTION} — pagamento único.
        </p>
        <Link
          to="/app/pagamento"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-5 text-small font-bold text-on-accent transition-all hover:bg-accent-hover"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Desbloquear por R$ {PRICE_EXECUTION}
        </Link>
      </div>
    </div>
  )
}

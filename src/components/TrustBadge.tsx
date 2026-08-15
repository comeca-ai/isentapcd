import { useState, type ReactNode } from 'react'
import { ShieldCheck, BookOpen, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TrustLevel = 'official' | 'secondary' | 'check'

const CONFIG: Record<
  TrustLevel,
  { label: string; hint: string; icon: ReactNode; classes: string }
> = {
  official: {
    label: 'Confirmado na fonte oficial',
    hint: 'Este dado foi checado diretamente na lei ou no site do órgão público.',
    icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
    classes: 'border-success/50 text-success',
  },
  secondary: {
    label: 'Fonte secundária',
    hint: 'Este dado vem de fonte confiável, mas não é a página oficial do órgão.',
    icon: <BookOpen className="h-4 w-4" aria-hidden="true" />,
    classes: 'border-warn/50 text-warn',
  },
  check: {
    label: 'Verificar com o órgão',
    hint: 'Este dado pode mudar — confirme com a SEFAZ do seu estado antes de decidir.',
    icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
    classes: 'border-danger/50 text-danger',
  },
}

interface TrustBadgeProps {
  level: TrustLevel
  /** Texto extra exibido após o rótulo padrão (ex.: "preço público e fixo"). */
  suffix?: string
  className?: string
}

/**
 * Pílula de confiança com ícone + texto (design.md §2.2) — nunca apenas cor.
 * Clique/toque abre explicação acessível.
 */
export default function TrustBadge({ level, suffix, className }: TrustBadgeProps) {
  const [open, setOpen] = useState(false)
  const cfg = CONFIG[level]

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${cfg.label}. ${cfg.hint}`}
        className={cn(
          'inline-flex min-h-[28px] items-center gap-1.5 rounded-full border bg-transparent px-2.5 py-1 font-mono text-xs transition-colors hover:bg-surface',
          cfg.classes,
        )}
      >
        {cfg.icon}
        <span>
          {cfg.label}
          {suffix ? ` · ${suffix}` : ''}
        </span>
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-2 w-64 rounded-input border border-line bg-surface p-3 text-left text-small text-txt shadow-card-light"
        >
          {cfg.hint}
        </span>
      )}
    </span>
  )
}

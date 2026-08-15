import type { ReactNode } from 'react'
import { AlertTriangle, ExternalLink, Calculator } from 'lucide-react'

/** Caixa coral de armadilha comum (guia.md C2). */
export function AlertaArmadilha({ children }: { children: ReactNode }) {
  return (
    <aside className="my-8 flex gap-4 rounded-card border border-danger/50 bg-danger/[.07] p-5">
      <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-danger" aria-hidden="true" />
      <div>
        <p className="font-mono text-xs font-medium uppercase tracking-wider text-danger">
          Armadilha comum
        </p>
        <div className="mt-1 text-body text-txt [&_p]:max-w-none">{children}</div>
      </div>
    </aside>
  )
}

interface FonteOficialProps {
  /** Nome do órgão/serviço, ex.: "Receita Federal — SISEN". */
  nome: string
  url: string
  /** Data de verificação, ex.: "ago/2026". */
  verificadoEm?: string
  children?: ReactNode
}

/** Caixa musgo com link para a fonte oficial (guia.md C2). */
export function FonteOficial({ nome, url, verificadoEm, children }: FonteOficialProps) {
  return (
    <aside className="my-8 rounded-card border border-success/50 bg-success/[.07] p-5">
      <p className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wider text-success">
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Fonte oficial{verificadoEm ? ` · verificada em ${verificadoEm}` : ''}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-success/50 px-4 text-small font-medium text-success transition-colors hover:bg-success/10"
      >
        {nome}
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
      {children && <div className="mt-2 text-small text-txt-2 [&_p]:max-w-none">{children}</div>}
    </aside>
  )
}

/** Caixa com cálculo passo a passo em mono (guia.md C2). */
export function ExemploReal({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <figure className="my-8 rounded-card border border-line bg-surface p-5">
      <figcaption className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wider text-accent">
        <Calculator className="h-4 w-4" aria-hidden="true" />
        {titulo}
      </figcaption>
      <div className="mt-3 font-mono text-mono leading-relaxed text-txt [&_p]:max-w-none">
        {children}
      </div>
    </figure>
  )
}

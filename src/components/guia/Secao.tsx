import type { ReactNode } from 'react'

interface SecaoProps {
  id: string
  numero: string
  titulo: string
  children: ReactNode
}

/** Seção de capítulo com H2 numerado em mono (guia.md C2) e âncora para o sumário. */
export default function Secao({ id, numero, titulo, children }: SecaoProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2 id={`${id}-title`} className="text-h2 font-medium">
        <span className="mr-3 font-mono text-mono font-medium text-accent" aria-hidden="true">
          {numero}
        </span>
        {titulo}
      </h2>
      <div className="mt-5 space-y-5 text-body text-txt-2 [&_strong]:text-txt">{children}</div>
    </section>
  )
}

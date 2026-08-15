/** Stub genérico para rotas públicas — substituído pelos agentes de página. */
export default function PageStub({ title, description }: { title: string; description?: string }) {
  return (
    <section className="mx-auto max-w-content px-6 py-24 lg:px-10">
      <h1 className="text-h1 font-medium">{title}</h1>
      {description && <p className="mt-4 max-w-prose68 text-lead text-txt-2">{description}</p>}
    </section>
  )
}

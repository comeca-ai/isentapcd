import { CadastroWizard } from "@/components/app/CadastroWizard";

/**
 * /app/cadastro — formulário multi-etapas que alimenta o checklist, os
 * documentos e os protocolos (design app-cadastro.md). Modo claro (.app-light);
 * o AppShell final também aplica o escopo — a redundância é segura.
 */
export default function Cadastro() {
  return (
    <div className="app-light min-h-[100dvh] bg-bg text-txt">
      <section className="mx-auto max-w-content px-6 py-10 lg:px-10">
        <header className="mb-8">
          <h1 className="text-h1 font-medium">Meu cadastro</h1>
          <p className="mt-3 max-w-prose68 text-lead text-txt-2">
            Conte sobre a pessoa com deficiência, os condutores e o carro. Salvamos cada etapa
            automaticamente — pode sair e voltar sem perder nada.
          </p>
        </header>
        <CadastroWizard />
      </section>
    </div>
  );
}

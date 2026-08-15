import { Routes, Route } from 'react-router'
import Layout from '@/components/Layout'
import PageStub from '@/components/PageStub'
import Home from '@/pages/Home'
import Entrar from '@/pages/Entrar'
import Registrar from '@/pages/Registrar'

/** Stub claro para /app e /admin (escopo .app-light, design.md §5). */
function AppLightStub({ title }: { title: string }) {
  return (
    <div className="app-light min-h-[100dvh] bg-bg text-txt">
      <section className="mx-auto max-w-content px-6 py-24 lg:px-10">
        <h1 className="text-h1 font-medium">{title}</h1>
        <p className="mt-4 text-lead text-txt-2">Área em construção.</p>
      </section>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Site público (dark) — Layout no padrão children (react-dev.md) */}
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route path="/guia" element={<Layout><PageStub title="Guia completo" description="IPI, ICMS, IPVA, rodízio e requisitos — em linguagem simples." /></Layout>} />
      <Route path="/guia/:capitulo" element={<Layout><PageStub title="Capítulo do Guia" /></Layout>} />
      <Route path="/sobre" element={<Layout><PageStub title="Quem somos" /></Layout>} />
      <Route path="/transparencia" element={<Layout><PageStub title="Transparência" description="O que é grátis, o que é pago e por quê." /></Layout>} />
      <Route path="/termos" element={<Layout><PageStub title="Termos de uso" /></Layout>} />
      <Route path="/privacidade" element={<Layout><PageStub title="Privacidade" /></Layout>} />
      <Route path="/contato" element={<Layout><PageStub title="Contato" /></Layout>} />
      <Route path="/simulador" element={<Layout><PageStub title="Simulador de economia" /></Layout>} />
      <Route path="/pre-analise" element={<Layout><PageStub title="Pré-análise gratuita" description="2 minutos para descobrir se você tem direito." /></Layout>} />
      <Route path="/entrar" element={<Layout><Entrar /></Layout>} />
      <Route path="/registro" element={<Layout><Registrar /></Layout>} />

      {/* Área logada e admin (claro, escopo .app-light) */}
      <Route path="/app" element={<AppLightStub title="Dashboard" />} />
      <Route path="/app/documentos" element={<AppLightStub title="Meus documentos" />} />
      <Route path="/app/cadastro" element={<AppLightStub title="Meu cadastro" />} />
      <Route path="/app/pagamento" element={<AppLightStub title="Pagamento" />} />
      <Route path="/app/conta" element={<AppLightStub title="Minha conta" />} />
      <Route path="/admin" element={<AppLightStub title="Admin" />} />
      <Route path="/admin/*" element={<AppLightStub title="Admin" />} />

      {/* Fallback */}
      <Route path="*" element={<Layout><PageStub title="Página não encontrada" /></Layout>} />
    </Routes>
  )
}

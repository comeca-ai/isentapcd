import { Routes, Route } from 'react-router'
import Layout from '@/components/Layout'
import PageStub from '@/components/PageStub'
import Home from '@/pages/Home'
import Entrar from '@/pages/Entrar'
import Registrar from '@/pages/Registrar'
import Guia from '@/pages/Guia'
import GuiaCapitulo from '@/pages/GuiaCapitulo'
import Sobre from '@/pages/Sobre'
import Transparencia from '@/pages/Transparencia'
import Termos from '@/pages/Termos'
import Privacidade from '@/pages/Privacidade'
import Contato from '@/pages/Contato'
import Simulador from '@/pages/Simulador'
import PreAnalise from '@/pages/PreAnalise'
import AppShell from '@/components/app/AppShell'
import Dashboard from '@/pages/app/Dashboard'
import Documentos from '@/pages/app/Documentos'
import Cadastro from '@/pages/app/Cadastro'
import Pagamento from '@/pages/app/Pagamento'
import Conta from '@/pages/app/Conta'
import AdminShell from '@/components/admin/AdminShell'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminLeads from '@/pages/admin/AdminLeads'
import AdminProcessos from '@/pages/admin/AdminProcessos'
import AdminRevisao from '@/pages/admin/AdminRevisao'
import AdminPagamentos from '@/pages/admin/AdminPagamentos'
import { RequireAuth } from '@/components/RequireAuth'

export default function App() {
  return (
    <Routes>
      {/* Site público (dark) — Layout no padrão children (react-dev.md) */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/guia" element={<Layout><Guia /></Layout>} />
      <Route path="/guia/:capitulo" element={<Layout><GuiaCapitulo /></Layout>} />
      <Route path="/sobre" element={<Layout><Sobre /></Layout>} />
      <Route path="/transparencia" element={<Layout><Transparencia /></Layout>} />
      <Route path="/termos" element={<Layout><Termos /></Layout>} />
      <Route path="/privacidade" element={<Layout><Privacidade /></Layout>} />
      <Route path="/contato" element={<Layout><Contato /></Layout>} />
      <Route path="/simulador" element={<Layout><Simulador /></Layout>} />
      {/* Quiz imersivo: sem navbar pública (foco total na conversão) */}
      <Route path="/pre-analise" element={<PreAnalise />} />
      <Route path="/entrar" element={<Layout><Entrar /></Layout>} />
      <Route path="/registro" element={<Layout><Registrar /></Layout>} />

      {/* Área logada (claro, escopo .app-light via AppShell) */}
      <Route path="/app" element={<RequireAuth><AppShell><Dashboard /></AppShell></RequireAuth>} />
      <Route path="/app/documentos" element={<RequireAuth><AppShell><Documentos /></AppShell></RequireAuth>} />
      <Route path="/app/cadastro" element={<RequireAuth><AppShell><Cadastro /></AppShell></RequireAuth>} />
      <Route path="/app/pagamento" element={<RequireAuth><AppShell><Pagamento /></AppShell></RequireAuth>} />
      <Route path="/app/conta" element={<RequireAuth><AppShell><Conta /></AppShell></RequireAuth>} />

      {/* Admin (claro; AdminShell é layout-route com <Outlet/>) */}
      <Route path="/admin" element={<RequireAuth role="admin"><AdminShell /></RequireAuth>}>
        <Route index element={<AdminDashboard />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="processos" element={<AdminProcessos />} />
        <Route path="revisao" element={<AdminRevisao />} />
        <Route path="pagamentos" element={<AdminPagamentos />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Layout><PageStub title="Página não encontrada" /></Layout>} />
    </Routes>
  )
}

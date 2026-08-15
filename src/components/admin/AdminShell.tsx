import { useState } from 'react'
import { NavLink, Link, Outlet } from 'react-router'
import {
  LayoutDashboard,
  Users,
  Columns3,
  FileSearch,
  CreditCard,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/admin', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/admin/leads', label: 'Leads', icon: Users, end: false },
  { to: '/admin/processos', label: 'Processos', icon: Columns3, end: false },
  { to: '/admin/revisao', label: 'Revisão de documentos', icon: FileSearch, end: false },
  { to: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard, end: false },
] as const

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  // Badge com contagem da fila de revisão (admin.md A4)
  const queue = trpc.admin.reviewQueue.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
  const pendingCount = queue.data?.length ?? 0

  return (
    <nav aria-label="Navegação do painel" className="flex-1 px-3 py-4">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[44px] items-center gap-3 rounded-btn px-3 py-2.5 text-small font-bold transition-colors',
                  isActive
                    ? 'bg-ink-700 text-paper-50'
                    : 'text-paper-100/80 hover:bg-ink-800 hover:text-paper-50',
                )
              }
            >
              <item.icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {item.to === '/admin/revisao' && pendingCount > 0 && (
                <span
                  className="tnum rounded-full bg-amber-400 px-2 py-0.5 font-mono text-mono font-semibold text-ink-950"
                  aria-label={`${pendingCount} documentos aguardando revisão`}
                >
                  {pendingCount}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SidebarBrand() {
  return (
    <div className="border-b border-ink-700 px-5 py-5">
      <p className="font-display text-h3 font-semibold text-paper-50">IsentaPCD</p>
      <p className="mt-0.5 text-small text-paper-400">Painel interno</p>
      <img
        src="/assinatura-grupo.png"
        alt="Uma empresa do grupo começa.ai"
        width={1575}
        height={291}
        className="mt-2.5 h-[20px] w-auto rounded-[4px]"
      />
    </div>
  )
}

function SidebarFooter() {
  return (
    <div className="border-t border-ink-700 px-5 py-4">
      <p className="text-[13px] leading-relaxed text-paper-400">
        Plataforma privada de orientação. Não somos órgão governamental nem temos vínculo com
        Receita Federal, Sefaz ou Detran.
      </p>
    </div>
  )
}

/**
 * Shell do /admin (admin.md): sidebar escura --ink-900 como contraste de
 * "área interna", conteúdo claro no escopo .app-light. Usa o padrão de
 * layout-route com <Outlet/> (react-dev.md, padrão B).
 */
export default function AdminShell() {
  const { user } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="app-light min-h-[100dvh] bg-bg text-txt">
      <a
        href="#admin-conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-btn focus:bg-surface focus:px-4 focus:py-3 focus:text-small focus:font-bold focus:text-txt"
      >
        Pular para o conteúdo
      </a>

      <div className="flex min-h-[100dvh]">
        {/* Sidebar desktop (fixa) */}
        <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col bg-ink-900 lg:flex">
          <SidebarBrand />
          <SidebarNav />
          <SidebarFooter />
        </aside>

        {/* Drawer mobile */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu do painel">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute inset-0 bg-ink-950/60"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-ink-900">
              <div className="flex items-center justify-between border-b border-ink-700 pr-3">
                <SidebarBrand />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fechar menu"
                  className="flex size-11 items-center justify-center rounded-btn text-paper-100 hover:bg-ink-800"
                  autoFocus
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <SidebarNav onNavigate={() => setDrawerOpen(false)} />
              <SidebarFooter />
            </aside>
          </div>
        )}

        {/* Coluna principal */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex min-h-[64px] items-center gap-3 border-b border-line bg-surface px-4 lg:px-8">
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-btn text-txt hover:bg-bg-alt lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={drawerOpen}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <p className="text-small font-bold text-txt">Admin</p>
            <div className="ml-auto flex items-center gap-4">
              <Link
                to="/"
                className="flex min-h-[44px] items-center gap-2 rounded-btn px-3 text-small font-bold text-txt-2 underline decoration-1 underline-offset-4 hover:text-txt"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Ver site
              </Link>
              {user && (
                <p className="hidden items-center gap-2 text-small text-txt-2 sm:flex">
                  <span
                    className="flex size-8 items-center justify-center rounded-full bg-accent font-mono text-mono font-semibold text-on-accent"
                    aria-hidden="true"
                  >
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="font-bold text-txt">{user.name}</span>
                </p>
              )}
            </div>
          </header>

          <main id="admin-conteudo" className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

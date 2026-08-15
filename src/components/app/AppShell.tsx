import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import {
  LayoutDashboard,
  FolderOpen,
  ClipboardList,
  User,
  Menu,
  X,
  MessageCircle,
  Gift,
  Bell,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { WHATSAPP_URL, LEGAL_DISCLAIMER } from '@/lib/constants'
import { PAYWALL_ENABLED } from '@contracts/constants'
import { cn } from '@/lib/utils'

/**
 * AppShell — casca compartilhada da área logada `/app` (design.md §8.6).
 * Modo claro: aplica o escopo `.app-light` no wrapper (design.md §5).
 * Genérico: qualquer página de /app renderiza `<AppShell>{conteúdo}</AppShell>`.
 *
 * - Sidebar 264px (fixa em ≥1024px): logo, nav, card "Quem indica ganha", ajuda WhatsApp.
 * - Topbar: saudação com o nome (useAuth), badge de plano, sino, avatar.
 * - Mobile (<1024px): sidebar vira drawer com focus trap.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const payments = trpc.payments.status.useQuery(undefined, { retry: false })
  const paid = Boolean(payments.data?.paidAt)

  const firstName = user?.name?.trim().split(' ')[0] ?? ''
  const initials = (user?.name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  useFocusTrap(drawerOpen, drawerRef, () => setDrawerOpen(false))

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const closeOnNavigate = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) setDrawerOpen(false)
  }

  return (
    <div className="app-light min-h-[100dvh] bg-bg text-txt">
      {/* Skip link — primeiro elemento focável */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-btn focus:bg-accent focus:px-4 focus:py-2 focus:font-medium focus:text-on-accent"
      >
        Pular para o conteúdo
      </a>

      {/* Sidebar fixa (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-line bg-surface lg:flex">
        <SidebarContent paid={paid} />
      </aside>

      {/* Coluna principal */}
      <div className="flex min-h-[100dvh] flex-col lg:pl-[264px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur-[8px] sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            {/* Hambúrguer mobile */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-controls="app-drawer"
              aria-label="Abrir menu do app"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-btn border border-line text-txt lg:hidden"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <p className="truncate text-body">
              <span className="text-txt-2">Olá, </span>
              <strong className="font-bold">{firstName || 'você'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Badge de plano */}
            <span
              className={cn(
                'hidden items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-mono font-medium sm:inline-flex',
                paid
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-warn/40 bg-warn/10 text-warn',
              )}
            >
              {paid ? 'Acompanhamento ativo' : PAYWALL_ENABLED ? 'Pré-análise gratuita' : 'POC — tudo liberado'}
            </span>

            {/* Sino → feed de atividades do dashboard */}
            <Link
              to="/app#atividades"
              aria-label="Ver notificações e atividades"
              className="inline-flex h-11 w-11 items-center justify-center rounded-btn border border-line text-txt transition-colors hover:border-accent hover:text-accent"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
            </Link>

            {/* Avatar → conta */}
            <Link
              to="/app/conta"
              aria-label={`Minha conta — ${user?.name ?? ''}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-bg-alt text-small font-bold text-txt transition-colors hover:border-accent"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main id="conteudo" className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>

        {/* Disclaimer jurídico obrigatório (design.md §8.2) */}
        <footer className="border-t border-line px-4 py-6 sm:px-6 lg:px-10">
          <p className="text-small text-txt-2">{LEGAL_DISCLAIMER}</p>
          <p className="mt-2 text-small text-txt-2">
            <Link to="/termos" className="underline underline-offset-4 hover:text-txt">
              Termos de uso
            </Link>
            {' · '}
            <Link to="/privacidade" className="underline underline-offset-4 hover:text-txt">
              Privacidade
            </Link>
          </p>
        </footer>
      </div>

      {/* Drawer mobile (<1024px) com focus trap */}
      {drawerOpen && (
        <div
          id="app-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu do app"
          onClick={closeOnNavigate}
          className="fixed inset-0 z-[70] flex flex-col bg-surface lg:hidden"
        >
          <div className="flex h-[72px] items-center justify-between border-b border-line px-4">
            <Link to="/" aria-label="IsentaPCD — página inicial">
              <img src="/logo.svg" alt="IsentaPCD" width={180} height={48} className="h-10 w-auto" />
            </Link>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Fechar menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-btn border border-line text-txt"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarContent paid={paid} />
          </div>
        </div>
      )}
    </div>
  )
}

// Alias nomeado para quem preferir `import { AppShell }`.
export { AppShell }

// ── Internos ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/documentos', label: 'Meus documentos', icon: FolderOpen, end: false },
  { to: '/app/cadastro', label: 'Meu cadastro', icon: ClipboardList, end: false },
  { to: '/app/conta', label: 'Conta', icon: User, end: false },
] as const

function SidebarContent({ paid }: { paid: boolean }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="hidden px-2 pt-2 lg:block">
        <Link to="/" aria-label="IsentaPCD — página inicial">
          <img src="/logo.svg" alt="IsentaPCD" width={180} height={48} className="h-11 w-auto" />
        </Link>
        <img
          src="/assinatura-grupo.png"
          alt="Uma empresa do grupo começa.ai"
          width={1575}
          height={291}
          className="mt-2 h-[20px] w-auto rounded-[4px]"
        />
      </div>

      <nav aria-label="Navegação do app">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[44px] items-center gap-3 rounded-btn px-3 py-2.5 text-small font-medium transition-colors',
                    isActive
                      ? 'bg-accent/10 font-bold text-accent'
                      : 'text-txt-2 hover:bg-bg-alt hover:text-txt',
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        {/* Card "Quem indica ganha" (compacto) */}
        <section
          aria-label="Quem indica ganha"
          className="rounded-card border border-danger/25 bg-danger/5 p-4"
        >
          <h2 className="flex items-center gap-2 text-small font-bold text-txt">
            <Gift className="h-4 w-4 text-danger" aria-hidden="true" />
            Quem indica ganha
          </h2>
          <p className="mt-1 text-small text-txt-2">
            Indique alguém com direito e ganhe R$ 100 de desconto quando a pessoa fechar.
          </p>
          <Link
            to="/app/conta#indicacoes"
            className="mt-2 inline-block text-small font-bold text-accent underline underline-offset-4 hover:text-accent-hover"
          >
            Ver minhas indicações
          </Link>
        </section>

        {/* Bloco de ajuda WhatsApp */}
        <section
          aria-label="Ajuda"
          className="rounded-card border border-line bg-bg-alt p-4"
        >
          <h2 className="text-small font-bold text-txt">Ficou com dúvida?</h2>
          <p className="mt-1 text-small text-txt-2">
            Fale com um humano do time — respondemos em horário comercial.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-btn bg-whatsapp-light px-4 text-small font-bold text-white transition-colors hover:bg-whatsapp-dark active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Falar no WhatsApp
          </a>
        </section>

        {!paid && PAYWALL_ENABLED && (
          <Link
            to="/app/pagamento"
            className="block rounded-btn border border-warn/40 bg-warn/10 px-4 py-3 text-center text-small font-bold text-warn transition-colors hover:bg-warn/15"
          >
            Desbloquear acompanhamento — R$ 497
          </Link>
        )}
      </div>
    </div>
  )
}

/** Foca o primeiro elemento focável e aprisiona Tab dentro do drawer. */
function useFocusTrap(
  active: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!active || !containerRef.current) return
    const container = containerRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )

    focusables()[0]?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [active, containerRef, onClose])
}

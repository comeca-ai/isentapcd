import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { Menu, X, MessageCircle, ArrowRight } from 'lucide-react'
import { WHATSAPP_URL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import NavbarAuth from '@/components/NavbarAuth'

const NAV_LINKS = [
  { to: '/#como-funciona', label: 'Como funciona', hash: 'como-funciona' },
  { to: '/guia', label: 'Guia' },
  { to: '/simulador', label: 'Simulador' },
  { to: '/sobre', label: 'Quem somos' },
  { to: '/#faq', label: 'FAQ', hash: 'faq' },
] as const

/** Foca o primeiro elemento focável e aprisiona Tab dentro do drawer. */
function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
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

    const first = focusables()[0]
    first?.focus()

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

/**
 * Navbar pública (design.md §8.1) — sticky top-0 z-50 (fluxo normal,
 * contrato de posicionamento do react-dev.md).
 */
export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useFocusTrap(drawerOpen, drawerRef, () => setDrawerOpen(false))

  // Fecha o drawer ao clicar em qualquer link dentro dele
  const closeOnNavigate = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) setDrawerOpen(false)
  }
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b bg-ink-950/[.88] backdrop-blur-[12px] transition-colors',
        scrolled ? 'border-line' : 'border-transparent',
      )}
    >
      {/* Skip link — primeiro elemento focável */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-btn focus:bg-accent focus:px-4 focus:py-2 focus:font-medium focus:text-on-accent"
      >
        Pular para o conteúdo
      </a>

      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-[88px] max-w-wide items-center justify-between gap-4 px-6 lg:px-10"
      >
        <div className="flex shrink-0 flex-col">
          <Link to="/" aria-label="IsentaPCD — página inicial">
            <img src="/logo.svg" alt="IsentaPCD" width={180} height={48} className="h-10 w-auto" />
          </Link>
          <img
            src="/assinatura-grupo.png"
            alt="Uma empresa do grupo começa.ai"
            width={1575}
            height={291}
            className="mt-1.5 h-[26px] w-auto rounded-[5px] opacity-90"
          />
        </div>

        {/* Links desktop */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              {'hash' in link ? (
                <a
                  href={link.to}
                  className="rounded-btn px-3 py-2 text-small font-medium text-txt-2 transition-colors hover:text-txt"
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-btn px-3 py-2 text-small font-medium transition-colors',
                      isActive ? 'text-accent' : 'text-txt-2 hover:text-txt',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              )}
            </li>
          ))}
        </ul>

        {/* CTAs desktop */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* AUTH-SLOT: autenticação real via useAuth() */}
          <NavbarAuth variant="desktop" />
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-4 text-small font-medium text-txt transition-colors hover:border-success hover:text-success"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Falar no WhatsApp
          </a>
          <Link
            to="/pre-analise"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-5 text-small font-bold text-on-accent transition-all hover:bg-accent-hover hover:shadow-amber-glow active:scale-[0.98]"
          >
            Fazer pré-análise grátis
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Hambúrguer mobile */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls="menu-mobile"
          aria-label="Abrir menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-btn border border-line text-txt lg:hidden"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </nav>

      {/* Drawer mobile full-screen com focus trap */}
      {drawerOpen && (
        <div
          id="menu-mobile"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          onClick={closeOnNavigate}
          className="fixed inset-0 z-[70] flex flex-col bg-bg lg:hidden"
        >
          <div className="flex h-[72px] items-center justify-between border-b border-line px-6">
            <img src="/logo.svg" alt="IsentaPCD" width={180} height={48} className="h-10 w-auto" />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Fechar menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-btn border border-line text-txt"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <ul className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-8">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                {'hash' in link ? (
                  <a
                    href={link.to}
                    className="block rounded-btn px-2 py-4 text-xl font-medium text-txt hover:bg-surface"
                  >
                    {link.label}
                  </a>
                ) : (
                  <NavLink
                    to={link.to}
                    className="block rounded-btn px-2 py-4 text-xl font-medium text-txt hover:bg-surface"
                  >
                    {link.label}
                  </NavLink>
                )}
              </li>
            ))}
            <li>
              {/* AUTH-SLOT: autenticação real via useAuth() */}
              <NavbarAuth variant="mobile" />
            </li>
          </ul>

          <div className="flex flex-col gap-3 border-t border-line px-6 py-6">
            <Link
              to="/pre-analise"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-accent px-5 font-bold text-on-accent active:scale-[0.98]"
            >
              Fazer pré-análise grátis
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-whatsapp-dark px-5 font-medium text-white active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

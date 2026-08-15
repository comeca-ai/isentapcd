import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronDown, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/**
 * Slot de autenticação da Navbar:
 * loading → placeholder neutro · deslogado → "Entrar" · logado → nome + menu.
 */
export default function NavbarAuth({ variant }: { variant: 'desktop' | 'mobile' }) {
  const { user, isLoading, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  if (isLoading) {
    // placeholder neutro enquanto a sessão é verificada
    return variant === 'desktop' ? (
      <span className="inline-block h-9 w-20 animate-pulse rounded-btn bg-surface" aria-hidden="true" />
    ) : (
      <span className="block rounded-btn px-2 py-4 text-xl font-medium text-txt-2" aria-hidden="true">
        …
      </span>
    )
  }

  if (!user) {
    return (
      <Link
        to="/entrar"
        className={
          variant === 'desktop'
            ? 'rounded-btn px-3 py-2 text-small font-medium text-txt-2 transition-colors hover:text-txt'
            : 'block rounded-btn px-2 py-4 text-xl font-medium text-txt hover:bg-surface'
        }
      >
        Entrar
      </Link>
    )
  }

  const firstName = user.name.split(' ')[0]

  async function onLogout() {
    setOpen(false)
    await logout.mutateAsync()
    navigate('/')
  }

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-1">
        <Link to="/app" className="block rounded-btn px-2 py-4 text-xl font-medium text-txt hover:bg-surface">
          Minha área
        </Link>
        {user.role === 'admin' && (
          <Link to="/admin" className="block rounded-btn px-2 py-4 text-xl font-medium text-txt hover:bg-surface">
            Admin
          </Link>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="block rounded-btn px-2 py-4 text-left text-xl font-medium text-txt hover:bg-surface"
        >
          Sair ({firstName})
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-btn px-3 py-2 text-small font-medium text-txt transition-colors hover:text-accent"
      >
        {firstName}
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-52 rounded-card border border-line bg-surface p-2 shadow-lg"
        >
          <Link
            role="menuitem"
            to="/app"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-input px-3 py-3 text-small font-medium text-txt hover:bg-bg"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Minha área
          </Link>
          {user.role === 'admin' && (
            <Link
              role="menuitem"
              to="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-input px-3 py-3 text-small font-medium text-txt hover:bg-bg"
            >
              Admin
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-input px-3 py-3 text-left text-small font-medium text-txt hover:bg-bg"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}

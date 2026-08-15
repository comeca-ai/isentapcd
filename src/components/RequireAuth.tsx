import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

/** /app/* exige login; /admin exige role=admin. */
export function RequireAuth({ children, role }: { children: ReactNode; role?: 'admin' }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="app-light flex min-h-[100dvh] items-center justify-center bg-bg">
        <p className="text-lead text-txt-2" role="status">
          Verificando sua sessão…
        </p>
      </div>
    )
  }
  if (!user) {
    const next = encodeURIComponent(location.pathname)
    return <Navigate to={`/entrar?next=${next}`} replace />
  }
  if (role === 'admin' && user.role !== 'admin') {
    return <Navigate to="/app" replace />
  }
  return <>{children}</>
}

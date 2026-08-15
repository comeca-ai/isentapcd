import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

/**
 * Entrar (/entrar) — auth real e-mail+senha (SEM OAuth), modo claro .app-light.
 */
export default function Entrar() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) navigate(next, { replace: true })
  }, [isAuthenticated, navigate, next])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.includes('@')) {
      setError('Informe um e-mail válido, por exemplo: maria@email.com.')
      return
    }
    if (!password) {
      setError('Informe sua senha.')
      return
    }
    try {
      await login.mutateAsync({ email, password })
      navigate(next, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente de novo.')
    }
  }

  return (
    <div className="app-light bg-bg text-txt">
      <section className="mx-auto flex min-h-[70dvh] max-w-content flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-md rounded-card border border-line bg-surface p-8 shadow-sm lg:p-10">
          <h1 className="text-h2 font-medium">Entrar na sua conta</h1>
          <p className="mt-2 text-small text-txt-2">
            Acompanhe seu processo de isenção de IPI + ICMS + IPVA.
          </p>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate={false}>
            {error && (
              <div
                role="alert"
                className="rounded-input border border-danger/40 bg-danger/5 px-4 py-3 text-small font-medium text-danger"
              >
                {error}
              </div>
            )}
            <div>
              <label htmlFor="entrar-email" className="mb-1 block text-small font-bold">
                E-mail
              </label>
              <input
                id="entrar-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[52px] w-full rounded-input border-[1.5px] border-line bg-paper-card px-4 text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="entrar-senha" className="mb-1 block text-small font-bold">
                Senha
              </label>
              <input
                id="entrar-senha"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[52px] w-full rounded-input border-[1.5px] border-line bg-paper-card px-4 text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                placeholder="Sua senha"
              />
            </div>
            <button
              type="submit"
              disabled={login.isPending}
              className="inline-flex min-h-[52px] items-center justify-center rounded-btn bg-accent px-5 font-bold text-on-accent transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
            >
              {login.isPending ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-small text-txt-2">
            Ainda não tem conta?{' '}
            <Link to="/registro" className="font-bold text-accent underline">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}

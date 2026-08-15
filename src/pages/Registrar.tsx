import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

/**
 * Registrar (/registro) — auth real e-mail+senha (SEM OAuth), modo claro .app-light.
 */
export default function Registrar() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/app'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referredBy, setReferredBy] = useState(params.get('indicacao') ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) navigate(next, { replace: true })
  }, [isAuthenticated, navigate, next])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) {
      setError('Informe seu nome completo.')
      return
    }
    if (!email.includes('@')) {
      setError('Informe um e-mail válido, por exemplo: maria@email.com.')
      return
    }
    if (password.length < 8) {
      setError('A senha precisa de pelo menos 8 caracteres.')
      return
    }
    try {
      await register.mutateAsync({
        name: name.trim(),
        email,
        password,
        referredBy: referredBy.trim() || undefined,
      })
      navigate(next, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta. Tente de novo.')
    }
  }

  return (
    <div className="app-light bg-bg text-txt">
      <section className="mx-auto flex min-h-[70dvh] max-w-content flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-md rounded-card border border-line bg-surface p-8 shadow-sm lg:p-10">
          <h1 className="text-h2 font-medium">Criar sua conta</h1>
          <p className="mt-2 text-small text-txt-2">
            Grátis para começar: pré-análise, mapa da sua UF e checklist básico.
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
              <label htmlFor="reg-nome" className="mb-1 block text-small font-bold">
                Nome completo
              </label>
              <input
                id="reg-nome"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-[52px] w-full rounded-input border-[1.5px] border-line bg-paper-card px-4 text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                placeholder="Como você se chama"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="mb-1 block text-small font-bold">
                E-mail
              </label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-senha" className="mb-1 block text-small font-bold">
                Senha
              </label>
              <input
                id="reg-senha"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby="reg-senha-hint"
                className="h-[52px] w-full rounded-input border-[1.5px] border-line bg-paper-card px-4 text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                placeholder="Mínimo de 8 caracteres"
              />
              <p id="reg-senha-hint" className="mt-1 text-small text-txt-2">
                Use pelo menos 8 caracteres. Nunca pediremos sua senha do Gov.br.
              </p>
            </div>
            <div>
              <label htmlFor="reg-indicacao" className="mb-1 block text-small font-bold">
                Quem indicou você? <span className="font-normal text-txt-2">(opcional)</span>
              </label>
              <input
                id="reg-indicacao"
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                className="h-[52px] w-full rounded-input border-[1.5px] border-line bg-paper-card px-4 text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                placeholder="Nome de quem indicou"
              />
            </div>
            <button
              type="submit"
              disabled={register.isPending}
              className="inline-flex min-h-[52px] items-center justify-center rounded-btn bg-accent px-5 font-bold text-on-accent transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
            >
              {register.isPending ? 'Criando…' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="mt-6 text-center text-small text-txt-2">
            Já tem conta?{' '}
            <Link to="/entrar" className="font-bold text-accent underline">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}

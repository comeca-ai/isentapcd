import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  LogOut,
  Mail,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react'
import AppShell from '@/components/app/AppShell'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { WHATSAPP_NUMBER, formatBRL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { PRICE_EXECUTION } from '@contracts/constants'

const NOTIF_KEY = 'isentapcd:prefs:notificacoes'

type PanelId = 'perfil' | 'notificacoes' | 'plano' | 'indicacoes' | 'privacidade'

const PANELS: { id: PanelId; label: string; Icon: typeof User }[] = [
  { id: 'perfil', label: 'Perfil e acesso', Icon: User },
  { id: 'notificacoes', label: 'Notificações', Icon: Bell },
  { id: 'plano', label: 'Plano e pagamentos', Icon: BadgeCheck },
  { id: 'indicacoes', label: 'Indicações', Icon: Gift },
  { id: 'privacidade', label: 'Privacidade e dados', Icon: ShieldCheck },
]

/** Conta (/app/conta) — configurações, plano, indicações, LGPD (app-conta.md). */
export default function Conta() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [panel, setPanel] = useState<PanelId>('perfil')
  const [loggingOut, setLoggingOut] = useState(false)

  // Hash direto (#indicacoes vindo do card da sidebar)
  useEffect(() => {
    const h = window.location.hash.replace('#', '') as PanelId
    if (PANELS.some((p) => p.id === h)) setPanel(h)
  }, [])

  async function sair() {
    setLoggingOut(true)
    try {
      await logout.mutateAsync()
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-content">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-h2 font-medium">Minha conta</h1>
            <p className="mt-1 text-body text-txt-2">
              Seus dados, seu plano e suas preferências — tudo em um lugar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void sair()}
            disabled={loggingOut}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line bg-surface px-5 text-small font-bold text-txt transition-colors hover:border-danger hover:text-danger disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {loggingOut ? 'Saindo…' : 'Sair da conta'}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,720px)]">
          {/* Subnav vertical (select no mobile) */}
          <nav aria-label="Seções da conta">
            <div className="lg:hidden">
              <label htmlFor="conta-secao" className="mb-1 block text-small font-bold">
                Seção da conta
              </label>
              <select
                id="conta-secao"
                value={panel}
                onChange={(e) => setPanel(e.target.value as PanelId)}
                className="min-h-[52px] w-full rounded-input border-[1.5px] border-line bg-surface px-4 text-body text-txt"
              >
                {PANELS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <ul className="hidden flex-col gap-1 lg:flex">
              {PANELS.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setPanel(p.id)}
                    aria-current={panel === p.id ? 'page' : undefined}
                    className={cn(
                      'flex min-h-[44px] w-full items-center gap-3 rounded-btn px-3 py-2.5 text-left text-small font-medium transition-colors',
                      panel === p.id
                        ? 'bg-accent/10 font-bold text-accent'
                        : 'text-txt-2 hover:bg-surface hover:text-txt',
                    )}
                  >
                    <p.Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Painel de conteúdo (crossfade 200ms) */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={panel}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              className="min-w-0"
            >
              {panel === 'perfil' && <PerfilPanel name={user?.name ?? ''} email={user?.email ?? ''} createdAt={user?.createdAt} />}
              {panel === 'notificacoes' && <NotificacoesPanel />}
              {panel === 'plano' && <PlanoPanel />}
              {panel === 'indicacoes' && <IndicacoesPanel />}
              {panel === 'privacidade' && <PrivacidadePanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  )
}

// ── CT1 — Perfil e acesso ──────────────────────────────────────────────────

function PerfilPanel({
  name,
  email,
  createdAt,
}: {
  name: string
  email: string
  createdAt: Date | undefined
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <section aria-labelledby="conta-perfil" className="flex flex-col gap-6">
      <div className="rounded-card border border-line bg-surface p-6 shadow-card-light">
        <h2 id="conta-perfil" className="sr-only">
          Perfil e acesso
        </h2>
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-alt text-h3 font-bold text-txt"
          >
            {initials || '?'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-body font-bold text-txt">{name}</p>
            <p className="truncate text-small text-txt-2">{email}</p>
            {createdAt && (
              <p className="mt-0.5 text-small text-txt-2">
                Conta criada em {new Date(createdAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </div>

      <ChangePasswordForm />
    </section>
  )
}

function passwordStrength(pw: string): { label: string; pct: number; cls: string } {
  if (!pw) return { label: '', pct: 0, cls: 'bg-line' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { label: 'fraca — combine maiúsculas, números e símbolos', pct: 33, cls: 'bg-danger' }
  if (score <= 3) return { label: 'ok — dá para melhorar com mais variedade', pct: 66, cls: 'bg-warn' }
  return { label: 'forte', pct: 100, cls: 'bg-success' }
}

function ChangePasswordForm() {
  const changePassword = trpc.auth.changePassword.useMutation()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  const strength = passwordStrength(next)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(false)

    // Erros descritivos antes de chamar a API (design.md §9.8)
    if (!current) return fail('Informe sua senha atual.')
    if (next.length < 8) return fail('A nova senha precisa de pelo menos 8 caracteres.')
    if (next === current) return fail('A nova senha está igual à atual — escolha uma diferente.')
    if (next !== confirm) return fail('A confirmação não bate com a nova senha. Digite as duas iguais.')

    try {
      await changePassword.mutateAsync({ currentPassword: current, newPassword: next })
      setOk(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Não foi possível trocar a senha. Tente de novo.')
    }
  }

  function fail(msg: string) {
    setError(msg)
    // move o foco para o resumo de erro (a11y)
    window.setTimeout(() => summaryRef.current?.focus(), 0)
  }

  return (
    <section
      aria-labelledby="conta-senha"
      className="rounded-card border border-line bg-surface p-6 shadow-card-light"
    >
      <h2 id="conta-senha" className="flex items-center gap-2 text-h3 font-medium">
        <KeyRound className="h-5 w-5 text-txt-2" aria-hidden="true" />
        Trocar senha
      </h2>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-5 flex flex-col gap-5" noValidate>
        {error && (
          <div
            ref={summaryRef}
            id="pw-erro"
            role="alert"
            tabIndex={-1}
            className="rounded-input border border-danger/40 bg-danger/5 px-4 py-3 text-small font-medium text-danger"
          >
            <AlertTriangle className="mr-1.5 inline h-4 w-4 align-[-2px]" aria-hidden="true" />
            {error}
          </div>
        )}
        {ok && (
          <div
            role="status"
            className="rounded-input border border-success/40 bg-success/5 px-4 py-3 text-small font-medium text-success"
          >
            <Check className="mr-1.5 inline h-4 w-4 align-[-2px]" aria-hidden="true" />
            Senha alterada com sucesso.
          </div>
        )}

        <div>
          <label htmlFor="pw-atual" className="mb-1 block text-small font-bold">
            Senha atual
          </label>
          <input
            id="pw-atual"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="min-h-[52px] w-full rounded-input border-[1.5px] border-line bg-surface px-4 text-body text-txt"
            aria-describedby={error ? 'pw-erro' : undefined}
          />
        </div>

        <div>
          <label htmlFor="pw-nova" className="mb-1 block text-small font-bold">
            Nova senha
          </label>
          <p id="pw-nova-hint" className="mb-1 text-small text-txt-2">
            Mínimo de 8 caracteres. Misture letras, números e símbolos.
          </p>
          <input
            id="pw-nova"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="min-h-[52px] w-full rounded-input border-[1.5px] border-line bg-surface px-4 text-body text-txt"
            aria-describedby="pw-nova-hint pw-forca"
          />
          {/* Medidor de força: barra + texto (nunca só cor) */}
          {next && (
            <p id="pw-forca" className="mt-2 text-small text-txt-2">
              Força da senha:{' '}
              <strong
                className={cn(
                  'font-bold',
                  strength.pct === 100
                    ? 'text-success'
                    : strength.pct >= 66
                      ? 'text-warn'
                      : 'text-danger',
                )}
              >
                {strength.label}
              </strong>
              <span
                aria-hidden="true"
                className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-bg-alt"
              >
                <span
                  className={cn('block h-full rounded-full transition-[width]', strength.cls)}
                  style={{ width: `${strength.pct}%` }}
                />
              </span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="pw-confirma" className="mb-1 block text-small font-bold">
            Confirmar nova senha
          </label>
          <input
            id="pw-confirma"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="min-h-[52px] w-full rounded-input border-[1.5px] border-line bg-surface px-4 text-body text-txt"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={changePassword.isPending}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-accent px-6 text-body font-bold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
          >
            {changePassword.isPending ? 'Salvando…' : 'Salvar nova senha'}
          </button>
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-pressed={showPw}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-4 text-small font-bold text-txt hover:bg-bg-alt"
          >
            {showPw ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
            {showPw ? 'Ocultar senhas' : 'Mostrar senhas'}
          </button>
        </div>
      </form>
    </section>
  )
}

// ── CT2 — Notificações (preferências visuais) ─────────────────────────────

interface NotifPrefs {
  waPrazos: boolean
  waDocs: boolean
  waEstado: boolean
  emailResumo: boolean
  emailPrazos: boolean
  emailRecibos: boolean
  frequencia: '30-15-3' | '7'
}

const DEFAULT_PREFS: NotifPrefs = {
  waPrazos: true,
  waDocs: true,
  waEstado: false,
  emailResumo: true,
  emailPrazos: true,
  emailRecibos: true,
  frequencia: '30-15-3',
}

function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<NotifPrefs>) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <span className="block text-small font-bold text-txt">{label}</span>
        {hint && <span className="block text-[0.8125rem] text-txt-2">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border transition-colors',
          checked ? 'border-accent bg-accent' : 'border-line bg-bg-alt',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
        <span className="sr-only">{checked ? 'ativado' : 'desativado'}</span>
      </button>
    </div>
  )
}

function NotificacoesPanel() {
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs)
  const [saved, setSaved] = useState(false)

  function update<K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) {
    const nextPrefs = { ...prefs, [key]: value }
    setPrefs(nextPrefs)
    localStorage.setItem(NOTIF_KEY, JSON.stringify(nextPrefs))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section
      aria-labelledby="conta-notif"
      className="rounded-card border border-line bg-surface p-6 shadow-card-light"
    >
      <h2 id="conta-notif" className="flex items-center gap-2 text-h3 font-medium">
        <Bell className="h-5 w-5 text-txt-2" aria-hidden="true" />
        Notificações
      </h2>
      <p aria-live="polite" className="sr-only">
        {saved ? 'Preferência salva.' : ''}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <fieldset>
          <legend className="text-small font-bold text-txt-2">
            <MessageCircle className="mr-1 inline h-4 w-4 align-[-2px]" aria-hidden="true" />
            WhatsApp
          </legend>
          <Toggle label="Lembretes de prazo" checked={prefs.waPrazos} onChange={(v) => update('waPrazos', v)} />
          <Toggle label="Revisão de documentos" checked={prefs.waDocs} onChange={(v) => update('waDocs', v)} />
          <Toggle label="Novidades do meu estado" checked={prefs.waEstado} onChange={(v) => update('waEstado', v)} />
        </fieldset>
        <fieldset>
          <legend className="text-small font-bold text-txt-2">
            <Mail className="mr-1 inline h-4 w-4 align-[-2px]" aria-hidden="true" />
            E-mail
          </legend>
          <Toggle label="Resumo semanal" checked={prefs.emailResumo} onChange={(v) => update('emailResumo', v)} />
          <Toggle label="Lembretes de prazo" checked={prefs.emailPrazos} onChange={(v) => update('emailPrazos', v)} />
          <Toggle label="Recibos" checked={prefs.emailRecibos} onChange={(v) => update('emailRecibos', v)} />
        </fieldset>
      </div>

      <fieldset className="mt-6 border-t border-line pt-5">
        <legend className="text-small font-bold text-txt">
          Frequência dos lembretes de prazo
        </legend>
        <div className="mt-2 flex flex-col gap-2">
          {(
            [
              { value: '30-15-3', label: '30, 15 e 3 dias antes (recomendado)' },
              { value: '7', label: 'Só 7 dias antes' },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-input border border-line px-4 py-2 has-[:checked]:border-accent has-[:checked]:bg-accent/5"
            >
              <input
                type="radio"
                name="freq-lembretes"
                value={opt.value}
                checked={prefs.frequencia === opt.value}
                onChange={() => update('frequencia', opt.value)}
                className="h-5 w-5 accent-[var(--accent)]"
              />
              <span className="text-small text-txt">{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-5 rounded-input border border-line bg-bg-alt px-4 py-3 text-small text-txt-2">
        Lembretes de prazo críticos (vencimento de autorização) são sempre enviados — são o coração
        do serviço.
      </p>
    </section>
  )
}

// ── CT3 — Plano e pagamentos ───────────────────────────────────────────────

function PlanoPanel() {
  const status = trpc.payments.status.useQuery(undefined, { retry: false })

  return (
    <section
      aria-labelledby="conta-plano"
      className="rounded-card border border-line bg-surface p-6 shadow-card-light"
    >
      <h2 id="conta-plano" className="flex items-center gap-2 text-h3 font-medium">
        <BadgeCheck className="h-5 w-5 text-txt-2" aria-hidden="true" />
        Meu plano
      </h2>

      {status.isLoading && (
        <p role="status" className="mt-4 text-small text-txt-2">
          Carregando plano…
        </p>
      )}
      {status.isError && (
        <div role="alert" className="mt-4">
          <p className="text-small text-txt-2">Não foi possível carregar seu plano.</p>
          <button
            type="button"
            onClick={() => void status.refetch()}
            className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-4 text-small font-bold text-txt hover:bg-bg-alt"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tentar de novo
          </button>
        </div>
      )}

      {status.data && !status.data.paidAt && (
        <div className="mt-4">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-warn/40 bg-warn/10 px-3 py-1.5 font-mono text-mono font-medium text-warn">
            Pré-análise gratuita
          </p>
          <p className="mt-3 text-body text-txt-2">
            Você está no plano gratuito. O acompanhamento completo ({formatBRL(PRICE_EXECUTION)},
            pagamento único) adiciona revisão humana, checklist completo e alertas de prazo.
          </p>
          <Link
            to="/app/pagamento"
            className="mt-4 inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-accent px-6 text-body font-bold text-on-accent transition-colors hover:bg-accent-hover"
          >
            Conhecer o acompanhamento completo
          </Link>
        </div>
      )}

      {status.data?.paidAt && (
        <div className="mt-4">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 font-mono text-mono font-medium text-success">
            <Check className="h-4 w-4" aria-hidden="true" />
            Acompanhamento ativo
          </p>
          <p className="mt-3 text-body text-txt-2">
            Ativo desde{' '}
            <strong className="tnum font-mono text-txt">
              {new Date(status.data.paidAt).toLocaleDateString('pt-BR')}
            </strong>
            . Pagamento único de {formatBRL(status.data.finalPrice)} — sem mensalidade.
          </p>
          <p className="mt-2 text-small text-txt-2">
            Garantia de 7 dias (art. 49 do CDC) e confirmação enviada por e-mail. Detalhes em{' '}
            <Link to="/app/pagamento" className="font-bold text-accent underline underline-offset-4">
              Pagamento
            </Link>
            .
          </p>
        </div>
      )}
    </section>
  )
}

// ── CT4 — Indicações ───────────────────────────────────────────────────────

function maskName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

const REF_STATUS_LABEL: Record<string, string> = {
  convertido: 'Virou cliente',
  converted: 'Virou cliente',
  new: 'Recebeu o link',
  contacted: 'Em conversa',
  lost: 'Não seguiu',
}

function IndicacoesPanel() {
  const referrals = trpc.referrals.myReferrals.useQuery(undefined, { retry: false })
  const share = trpc.referrals.shareText.useQuery(undefined, { retry: false })
  const [copied, setCopied] = useState(false)

  async function copyText() {
    if (!share.data?.text) return
    try {
      await navigator.clipboard.writeText(share.data.text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 4000)
    } catch {
      setCopied(false)
    }
  }

  const data = referrals.data

  return (
    <section
      aria-labelledby="conta-indicacoes"
      id="indicacoes"
      className="rounded-card border border-danger/25 bg-danger/5 p-6 shadow-card-light"
    >
      <h2 id="conta-indicacoes" className="flex items-center gap-2 text-h3 font-medium">
        <Gift className="h-5 w-5 text-danger" aria-hidden="true" />
        Minhas indicações
      </h2>

      {/* Regras em 3 linhas */}
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-small text-txt-2">
        <li>Você compartilha seu link ou manda a mensagem pronta no WhatsApp.</li>
        <li>Seu amigo fecha o acompanhamento e diz que foi indicação sua.</li>
        <li>
          Você ganha <strong className="text-txt">R$ {data?.recompensa ?? 100} de desconto</strong>{' '}
          no acompanhamento (via Pix ou abatimento).
        </li>
      </ol>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <a
          href={share.data?.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-btn bg-whatsapp-light px-5 text-small font-bold text-white transition-colors hover:bg-whatsapp-dark',
            !share.data && 'pointer-events-none opacity-50',
          )}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Compartilhar no WhatsApp
        </a>
        <button
          type="button"
          onClick={() => void copyText()}
          disabled={!share.data}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-btn border border-line bg-surface px-5 text-small font-bold text-txt transition-colors hover:bg-bg-alt disabled:opacity-50"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          {copied ? 'Mensagem copiada!' : 'Copiar mensagem'}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? 'Mensagem de indicação copiada.' : ''}
      </p>

      {/* Contador */}
      <p className="tnum mt-5 font-mono text-mono font-semibold text-txt">
        {data ? `${data.total} ${data.total === 1 ? 'indicação' : 'indicações'} · ${data.convertidos} ${data.convertidos === 1 ? 'convertida' : 'convertidas'}` : '…'}
        {data && (data.descontoAcumulado ?? 0) > 0 && (
          <span className="ml-2 text-success">
            · {formatBRL(data.descontoAcumulado ?? 0)} de desconto acumulado
          </span>
        )}
      </p>

      {/* Tabela de indicações */}
      {data && data.indicados.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-input border border-line bg-surface">
          <table className="w-full min-w-[380px] text-left text-small">
            <caption className="sr-only">Lista das suas indicações</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-4 py-2.5 font-bold text-txt">
                  Nome
                </th>
                <th scope="col" className="px-4 py-2.5 font-bold text-txt">
                  Status
                </th>
                <th scope="col" className="px-4 py-2.5 font-bold text-txt">
                  Desde
                </th>
              </tr>
            </thead>
            <tbody className="text-txt-2">
              {data.indicados.map((r, i) => (
                <tr key={`${r.name}-${i}`} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-txt">{maskName(r.name)}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.8125rem] font-medium',
                        r.status === 'convertido' || r.status === 'converted'
                          ? 'border-success/40 bg-success/10 text-success'
                          : 'border-line bg-bg-alt text-txt-2',
                      )}
                    >
                      {(r.status === 'convertido' || r.status === 'converted') && (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {REF_STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="tnum px-4 py-2.5 font-mono text-mono">
                    {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.indicados.length === 0 && (
        <p className="mt-4 text-small text-txt-2">
          Nenhuma indicação ainda — compartilhe sua mensagem e ela aparece aqui.
        </p>
      )}
    </section>
  )
}

// ── CT5 — Privacidade e dados (LGPD) ───────────────────────────────────────

const LGPD_EMAIL = 'privacidade@isentapcd.com.br'

function lgpdWhatsAppUrl(assunto: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Olá! Quero ${assunto} da minha conta IsentaPCD (LGPD).`,
  )}`
}

function PrivacidadePanel() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section aria-labelledby="conta-lgpd" className="flex flex-col gap-6">
      <div className="rounded-card border border-line bg-surface p-6 shadow-card-light">
        <h2 id="conta-lgpd" className="flex items-center gap-2 text-h3 font-medium">
          <ShieldCheck className="h-5 w-5 text-txt-2" aria-hidden="true" />
          Privacidade e dados (LGPD)
        </h2>
        <p className="mt-2 text-small text-txt-2">
          Seus dados são seus. Você pode baixar tudo ou pedir a exclusão quando quiser — sem
          letra miúda e sem precisar justificar.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-input border border-line p-4">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-small font-bold text-txt">
                <Download className="h-4 w-4 text-txt-2" aria-hidden="true" />
                Baixar meus dados
              </p>
              <p className="mt-0.5 text-small text-txt-2">
                Geramos um arquivo com seus dados e documentos e avisamos por e-mail.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={lgpdWhatsAppUrl('baixar meus dados')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-4 text-small font-bold text-txt hover:bg-bg-alt"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Pedir pelo WhatsApp
              </a>
              <a
                href={`mailto:${LGPD_EMAIL}?subject=${encodeURIComponent('Exportar meus dados (LGPD)')}`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-4 text-small font-bold text-txt hover:bg-bg-alt"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Pedir por e-mail
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-input border border-danger/30 p-4">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-small font-bold text-txt">
                <Trash2 className="h-4 w-4 text-danger" aria-hidden="true" />
                Excluir minha conta
              </p>
              <p className="mt-0.5 text-small text-txt-2">
                Caminho claro, sem pegadinha: explicamos o que é apagado antes de você decidir.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-danger px-4 text-small font-bold text-danger transition-colors hover:bg-danger/5"
            >
              Solicitar exclusão
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ExclusaoModal
          onClose={() => setModalOpen(false)}
          onRequested={() => {
            setModalOpen(false)
            void logout.mutateAsync().finally(() => navigate('/', { replace: true }))
          }}
        />
      )}
    </section>
  )
}

function ExclusaoModal({
  onClose,
  onRequested,
}: {
  onClose: () => void
  onRequested: () => void
}) {
  const [typed, setTyped] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap + Escape
  useEffect(() => {
    const container = modalRef.current
    if (!container) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        ),
      )
    focusables()[0]?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') return onClose()
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  const confirmed = typed.trim().toUpperCase() === 'EXCLUIR'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/60 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exclusao-titulo"
        className="w-full max-w-lg rounded-card border border-line bg-surface p-6 shadow-card-light"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="exclusao-titulo" className="text-h3 font-medium">
            Excluir sua conta
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-btn border border-line text-txt"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-small text-txt-2">
          <p>
            <strong className="text-txt">O que é apagado em até 30 dias:</strong> seus dados
            pessoais (nome, e-mail, cadastro) e todos os documentos enviados.
          </p>
          <p>
            <strong className="text-txt">O que fica retido:</strong> registros fiscais de
            pagamento (se houver), por obrigação legal — só o mínimo exigido pela Receita, pelo
            prazo legal.
          </p>
          <p>
            A exclusão é feita por um humano do time: ao confirmar, abrimos o WhatsApp com a
            mensagem pronta e você sai da conta. Sem dark pattern — se mudar de ideia, é só fechar
            esta janela.
          </p>
        </div>

        <label htmlFor="exclusao-confirma" className="mt-5 block text-small font-bold text-txt">
          Digite <span className="font-mono">EXCLUIR</span> para confirmar
        </label>
        <input
          id="exclusao-confirma"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          className="mt-1 min-h-[52px] w-full rounded-input border-[1.5px] border-line bg-surface px-4 font-mono text-body text-txt"
        />

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center rounded-btn border border-line px-5 text-small font-bold text-txt hover:bg-bg-alt"
          >
            Manter minha conta
          </button>
          <a
            href={lgpdWhatsAppUrl('solicitar a exclusão')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!confirmed) {
                e.preventDefault()
                return
              }
              onRequested()
            }}
            aria-disabled={!confirmed}
            className={cn(
              'inline-flex min-h-[44px] items-center gap-2 rounded-btn px-5 text-small font-bold transition-colors',
              confirmed
                ? 'bg-danger text-white hover:opacity-90'
                : 'pointer-events-none bg-bg-alt text-txt-2 opacity-60',
            )}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Confirmar exclusão
          </a>
        </div>
      </div>
    </div>
  )
}

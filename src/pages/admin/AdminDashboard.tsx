import type { ReactNode } from 'react'
import { Link } from 'react-router'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp, Users, ClipboardCheck, UserCheck, CreditCard } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { PRICE_EXECUTION } from '@contracts/constants'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const SOURCE_LABELS: Record<string, string> = {
  simulator: 'Simulador',
  quiz: 'Pré-análise (quiz)',
  site: 'Site',
}

function pct(part: number, whole: number): string {
  if (whole <= 0) return '—'
  return `${Math.round((part / whole) * 100)}%`
}

function SectionShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-card-light">
      <h2 className="text-h3 font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function DataDetails({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="mt-4 rounded-input border border-line bg-bg-alt/60 px-4 py-3">
      <summary className="min-h-[40px] cursor-pointer py-2 text-small font-bold text-txt">
        {label}
      </summary>
      <div className="overflow-x-auto pb-2">{children}</div>
    </details>
  )
}

export default function AdminDashboard() {
  const kpis = trpc.admin.kpis.useQuery()
  // Base para os recortes por UF/origem (amostra dos 200 leads mais recentes)
  const leads = trpc.admin.leads.useQuery({ limit: 200, offset: 0 })

  if (kpis.isLoading) {
    return (
      <p role="status" className="text-lead text-txt-2">
        Carregando visão geral…
      </p>
    )
  }
  if (kpis.error || !kpis.data) {
    return (
      <div role="alert" className="rounded-card border border-danger bg-surface p-6">
        <p className="font-bold text-danger">Não foi possível carregar os indicadores.</p>
        <p className="mt-1 text-small text-txt-2">{kpis.error?.message ?? 'Erro inesperado.'}</p>
      </div>
    )
  }

  const { funil, receita, documentosPendentes } = kpis.data

  const funilRows = [
    { etapa: 'Leads', valor: funil.leads },
    { etapa: 'Pré-análises', valor: funil.preAnalises },
    { etapa: 'Cadastros', valor: funil.cadastros },
    { etapa: 'Pagos', valor: funil.pagos },
  ]
  // Etapa com maior queda absoluta entre passos consecutivos
  let maiorQuedaIdx = -1
  let maiorQueda = 0
  for (let i = 1; i < funilRows.length; i++) {
    const queda = funilRows[i - 1].valor - funilRows[i].valor
    if (queda > maiorQueda) {
      maiorQueda = queda
      maiorQuedaIdx = i
    }
  }

  // Leads por UF (top 10 + outros) e por origem — agregados da amostra carregada
  const porUf = new Map<string, number>()
  const porOrigem = new Map<string, number>()
  for (const l of leads.data ?? []) {
    porUf.set(l.uf ?? '—', (porUf.get(l.uf ?? '—') ?? 0) + 1)
    porOrigem.set(l.source, (porOrigem.get(l.source) ?? 0) + 1)
  }
  const ufOrdenadas = [...porUf.entries()].sort((a, b) => b[1] - a[1])
  const ufTop = ufOrdenadas.slice(0, 10)
  const ufOutros = ufOrdenadas.slice(10).reduce((acc, [, n]) => acc + n, 0)
  const ufChart = [
    ...ufTop.map(([uf, total]) => ({ nome: uf, total })),
    ...(ufOutros > 0 ? [{ nome: 'Outros', total: ufOutros }] : []),
  ]
  const origemChart = [...porOrigem.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([source, total]) => ({ nome: SOURCE_LABELS[source] ?? source, total }))

  const kpiCards = [
    {
      label: 'Leads',
      valor: String(funil.leads),
      detalhe: `${funil.preAnalises} vieram da pré-análise`,
      icon: Users,
      to: '/admin/leads',
    },
    {
      label: 'Pré-análises concluídas',
      valor: String(funil.preAnalises),
      detalhe: `${pct(funil.preAnalises, funil.leads)} dos leads`,
      icon: ClipboardCheck,
      to: '/admin/leads',
    },
    {
      label: 'Cadastros',
      valor: String(funil.cadastros),
      detalhe: `${pct(funil.cadastros, funil.leads)} de conversão de leads`,
      icon: UserCheck,
      to: '/admin/processos',
    },
    {
      label: 'Clientes pagos',
      valor: String(funil.pagos),
      detalhe: `${BRL.format(receita)} em receita (${BRL.format(PRICE_EXECUTION)} × ${funil.pagos})`,
      icon: CreditCard,
      to: '/admin/pagamentos',
      mono: true,
    },
  ]

  return (
    <div className="mx-auto max-w-wide space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 font-medium">Visão geral</h1>
          <p className="mt-1 text-small text-txt-2">
            Funil de leads até o pagamento · {documentosPendentes}{' '}
            {documentosPendentes === 1 ? 'documento aguardando' : 'documentos aguardando'} revisão
          </p>
        </div>
      </div>

      {/* KPIs */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
        {kpiCards.map((kpi) => (
          <li key={kpi.label}>
            <Link
              to={kpi.to}
              className="block h-full rounded-card border border-line bg-surface p-5 shadow-card-light transition-colors hover:border-accent"
            >
              <span className="flex items-center gap-2 text-small font-bold text-txt-2">
                <kpi.icon className="size-4" aria-hidden="true" />
                {kpi.label}
              </span>
              <span
                className={`tnum mt-2 block text-h2 font-semibold ${kpi.mono ? 'font-mono' : ''}`}
              >
                {kpi.valor}
              </span>
              <span className="mt-1 block text-small text-txt-2">{kpi.detalhe}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Funil */}
      <SectionShell title="Funil de conversão">
        <p className="text-small text-txt-2">
          Leads → pré-análise → cadastro → pagamento. % entre etapas ao lado de cada barra.
        </p>
        <div className="mt-4 h-64" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funilRows} layout="vertical" margin={{ left: 24, right: 48 }}>
              <CartesianGrid stroke="var(--line)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} stroke="var(--text-2)" />
              <YAxis
                type="category"
                dataKey="etapa"
                width={130}
                stroke="var(--text-2)"
                tick={{ fill: 'var(--text)' }}
              />
              <Tooltip
                formatter={(v) => [String(v), 'Total']}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
              />
              <Bar dataKey="valor" fill="var(--accent)" radius={[0, 8, 8, 0]} maxBarSize={36}>
                {funilRows.map((row, i) => (
                  <Cell
                    key={row.etapa}
                    fill={i === maiorQuedaIdx ? 'var(--danger)' : 'var(--accent)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-small text-txt-2">
          {funilRows.slice(1).map((row, i) => (
            <li key={row.etapa}>
              {funilRows[i].etapa} → {row.etapa}:{' '}
              <strong className="text-txt">{pct(row.valor, funilRows[i].valor)}</strong>
            </li>
          ))}
        </ul>
        {maiorQuedaIdx > 0 && maiorQueda > 0 && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-danger px-3 py-1 text-small font-bold text-danger">
            <TrendingUp className="size-4 rotate-180" aria-hidden="true" />
            Maior perda aqui: {funilRows[maiorQuedaIdx - 1].etapa} → {funilRows[maiorQuedaIdx].etapa}{' '}
            (−{maiorQueda})
          </p>
        )}
        <DataDetails label="Ver funil em tabela">
          <table className="w-full min-w-[480px] text-left text-small">
            <caption className="sr-only">Dados do funil de conversão</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-4">Etapa</th>
                <th scope="col" className="py-2 pr-4">Total</th>
                <th scope="col" className="py-2">Conversão da etapa anterior</th>
              </tr>
            </thead>
            <tbody>
              {funilRows.map((row, i) => (
                <tr key={row.etapa} className="border-b border-line/60">
                  <th scope="row" className="py-2 pr-4 font-bold">{row.etapa}</th>
                  <td className="tnum py-2 pr-4 font-mono">{row.valor}</td>
                  <td className="py-2">{i === 0 ? '—' : pct(row.valor, funilRows[i - 1].valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataDetails>
      </SectionShell>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Leads por UF */}
        <SectionShell title="Leads por UF">
          {leads.isLoading && <p role="status" className="text-small text-txt-2">Carregando leads…</p>}
          {!leads.isLoading && ufChart.length === 0 && (
            <p className="text-small text-txt-2">Nenhum lead cadastrado ainda.</p>
          )}
          {ufChart.length > 0 && (
            <>
              <div className="h-72" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ufChart} layout="vertical" margin={{ left: 8, right: 32 }}>
                    <CartesianGrid stroke="var(--line)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} stroke="var(--text-2)" />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      width={64}
                      stroke="var(--text-2)"
                      tick={{ fill: 'var(--text)' }}
                    />
                    <Tooltip
                      formatter={(v) => [String(v), 'Leads']}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
                    />
                    <Bar dataKey="total" fill="var(--accent)" radius={[0, 8, 8, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <DataDetails label="Ver dados em tabela">
                <table className="w-full min-w-[320px] text-left text-small">
                  <caption className="sr-only">Leads por UF</caption>
                  <thead>
                    <tr className="border-b border-line">
                      <th scope="col" className="py-2 pr-4">UF</th>
                      <th scope="col" className="py-2">Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ufChart.map((r) => (
                      <tr key={r.nome} className="border-b border-line/60">
                        <th scope="row" className="py-2 pr-4 font-bold">{r.nome}</th>
                        <td className="tnum py-2 font-mono">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataDetails>
            </>
          )}
        </SectionShell>

        {/* Leads por origem */}
        <SectionShell title="Leads por origem">
          {!leads.isLoading && origemChart.length === 0 && (
            <p className="text-small text-txt-2">Nenhum lead cadastrado ainda.</p>
          )}
          {origemChart.length > 0 && (
            <>
              <div className="h-72" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={origemChart} margin={{ left: 8, right: 16, bottom: 8 }}>
                    <CartesianGrid stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="nome" stroke="var(--text-2)" tick={{ fill: 'var(--text)' }} />
                    <YAxis allowDecimals={false} stroke="var(--text-2)" />
                    <Tooltip
                      formatter={(v) => [String(v), 'Leads']}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
                    />
                    <Bar dataKey="total" fill="var(--warn)" radius={[8, 8, 0, 0]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <DataDetails label="Ver dados em tabela">
                <table className="w-full min-w-[320px] text-left text-small">
                  <caption className="sr-only">Leads por origem</caption>
                  <thead>
                    <tr className="border-b border-line">
                      <th scope="col" className="py-2 pr-4">Origem</th>
                      <th scope="col" className="py-2">Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {origemChart.map((r) => (
                      <tr key={r.nome} className="border-b border-line/60">
                        <th scope="row" className="py-2 pr-4 font-bold">{r.nome}</th>
                        <td className="tnum py-2 font-mono">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataDetails>
            </>
          )}
        </SectionShell>
      </div>

      <p className="text-small text-txt-2">
        Recortes por UF e origem usam os 200 leads mais recentes carregados do CRM.
      </p>
    </div>
  )
}

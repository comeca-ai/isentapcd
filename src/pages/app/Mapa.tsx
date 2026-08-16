import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Landmark,
  Map as MapIcon,
  Scale,
  Stethoscope,
  Timer,
  Wallet,
} from 'lucide-react'
import AppShell from '@/components/app/AppShell'
import TrustBadge from '@/components/TrustBadge'
import { trpc } from '@/providers/trpc'
import { FEDERAL, UF_MATRIX, type Uf, type UfMatrixEntry } from '@contracts/constants'
import { WHATSAPP_URL } from '@/lib/constants'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const IPVA_LABEL: Record<string, string> = {
  full: 'Isenção total',
  partial: 'Isenção parcial (há faixa de valor)',
  discount60: 'Desconto de 60% (não é isenção total)',
  restricted: 'Regras restritas neste estado',
  none: 'Sem isenção estadual',
  unknown: 'Regra em confirmação oficial',
}

function confidenceLevel(c: UfMatrixEntry['confidence']): 'official' | 'secondary' | 'check' {
  return c === 'official' ? 'official' : c === 'secondary' ? 'secondary' : 'check'
}

export default function Mapa() {
  const navigate = useNavigate()
  const profile = trpc.profile.get.useQuery()
  const timeline = trpc.stages.timeline.useQuery()
  const utils = trpc.useUtils()
  const confirmar = trpc.stages.updateStage.useMutation({
    onSuccess: async () => {
      await utils.stages.timeline.invalidate()
    },
  })

  const uf = (profile.data?.uf ?? null) as Uf | null
  const rule: UfMatrixEntry | null = uf ? UF_MATRIX[uf] : null
  const mapaStage = timeline.data?.stages.find((s) => s.key === 'mapa')
  const mapaDone = mapaStage?.status === 'done'
  const depPendente = (mapaStage?.blockedBy?.length ?? 0) > 0

  const prazos = useMemo(() => {
    if (!rule) return []
    const itens = [
      { label: 'Autorização do IPI vale', valor: `${FEDERAL.IPI_SISEN_AUTHORIZATION_DAYS} dias` },
      { label: 'Autorização do ICMS vale', valor: `${rule.icms.autorizacaoDias} dias` },
      { label: 'Após comprar: apresentar a NF à Sefaz até o', valor: '15º dia útil' },
    ]
    if (rule.ipva.prazoPosCompraDias) {
      itens.push({ label: 'Após a NF: pedir a isenção de IPVA em até', valor: `${rule.ipva.prazoPosCompraDias} dias` })
    }
    itens.push({ label: 'Carência para vender sem devolver imposto', valor: '2 anos (IPI) · 4 anos (ICMS)' })
    return itens
  }, [rule])

  return (
    <AppShell>
      <div className="mx-auto flex max-w-content flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-mono uppercase tracking-wider text-accent">Etapa 2 de 7</p>
          <h1 className="text-h1 font-medium text-txt">O mapa do seu estado</h1>
          <p className="max-w-[68ch] text-lead text-txt-2">
            É aqui que “tenho direito” vira <strong className="text-txt">plano concreto</strong>: o que vale no seu
            estado, onde protocolar, o que pagar antes e quais prazos não podem estourar.
          </p>
        </header>

        {/* Sem UF no cadastro → pedir o cadastro antes */}
        {!uf && (
          <div className="flex flex-col items-start gap-3 rounded-card border border-warn/40 bg-warn/10 p-6">
            <p className="text-body font-bold text-txt">Primeiro precisamos saber seu estado</p>
            <p className="text-small text-txt-2">
              O mapa é montado a partir da UF do seu cadastro (ICMS e IPVA mudam de estado para estado).
            </p>
            <Link
              to="/app/cadastro"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-4 text-small font-bold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Completar meu cadastro
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        {uf && rule && (
          <>
            {/* O que vale na sua UF */}
            <section aria-labelledby="mapa-vale" className="rounded-card border border-line bg-surface p-6 shadow-card-light lg:p-8">
              <h2 id="mapa-vale" className="flex items-center gap-2 text-h3 font-medium text-txt">
                <Scale className="h-5 w-5 text-accent" aria-hidden="true" />
                O que vale em {uf}
              </h2>
              <ul className="mt-4 flex flex-col gap-4">
                <li className="flex flex-col gap-1 rounded-input border border-line bg-bg-alt/50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-body text-txt">IPI (federal — todo o Brasil)</strong>
                    <TrustBadge level="official" />
                  </div>
                  <p className="text-small text-txt-2">
                    Isenção para carro 0 km até {BRL.format(FEDERAL.IPI_CEILING)} · pedido no SISEN com sua conta
                    Gov.br · gratuito · autorização vale {FEDERAL.IPI_SISEN_AUTHORIZATION_DAYS} dias.
                  </p>
                </li>
                <li className="flex flex-col gap-1 rounded-input border border-line bg-bg-alt/50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-body text-txt">ICMS ({uf})</strong>
                    <TrustBadge level={confidenceLevel(rule.icms.confidence)} />
                  </div>
                  <p className="text-small text-txt-2">
                    {rule.icms.tetoIntegral && `Isenção total até ${BRL.format(rule.icms.tetoIntegral)}`}
                    {rule.icms.tetoParcial && ` · parcial até ${BRL.format(rule.icms.tetoParcial)}`}
                    {rule.icms.exigeIpiAntes && ' · só depois do IPI deferido'}
                    {rule.icms.excecaoDown ? ' · Síndrome de Down pode pedir sem IPI antes' : ' · sem exceção de Síndrome de Down neste estado'}
                    .
                  </p>
                </li>
                <li className="flex flex-col gap-1 rounded-input border border-line bg-bg-alt/50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-body text-txt">IPVA ({uf})</strong>
                    <TrustBadge level={confidenceLevel(rule.ipva.confidence)} />
                  </div>
                  <p className="text-small text-txt-2">
                    {IPVA_LABEL[rule.ipva.tipo]}
                    {rule.ipva.teto ? ` · teto de ${BRL.format(rule.ipva.teto)}` : ''}
                    {rule.ipva.renovacaoAnual ? ' · precisa renovar todo ano' : ' · sem renovação anual'}
                    {rule.ipva.lei ? ` · ${rule.ipva.lei}` : ''}.
                  </p>
                </li>
              </ul>
            </section>

            {/* Onde protocolar + taxas + perícia */}
            <div className="grid gap-6 lg:grid-cols-2">
              <section aria-labelledby="mapa-onde" className="rounded-card border border-line bg-surface p-6 shadow-card-light">
                <h2 id="mapa-onde" className="flex items-center gap-2 text-h3 font-medium text-txt">
                  <Landmark className="h-5 w-5 text-accent" aria-hidden="true" />
                  Onde protocolar
                </h2>
                <ul className="mt-3 flex flex-col gap-3 text-small text-txt-2">
                  <li>
                    <strong className="text-txt">IPI:</strong> SISEN — sistema oficial da Receita Federal
                    (sisen.receita.fazenda.gov.br), login com a <strong>sua</strong> conta Gov.br. Nunca pedimos sua senha.
                  </li>
                  <li>
                    <strong className="text-txt">ICMS:</strong>{' '}
                    {rule.icms.sistema ?? 'portal da Secretaria da Fazenda do seu estado'}
                    {rule.icms.sistemaUrl && (
                      <>
                        {' '}
                        <a
                          href={rule.icms.sistemaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-accent underline underline-offset-4"
                        >
                          abrir site oficial
                        </a>
                      </>
                    )}
                  </li>
                </ul>
              </section>

              <section aria-labelledby="mapa-taxas" className="rounded-card border border-line bg-surface p-6 shadow-card-light">
                <h2 id="mapa-taxas" className="flex items-center gap-2 text-h3 font-medium text-txt">
                  <Wallet className="h-5 w-5 text-accent" aria-hidden="true" />
                  O que precisa estar pago antes
                </h2>
                <ul className="mt-3 flex flex-col gap-3 text-small text-txt-2">
                  <li>
                    <strong className="text-txt">Federal (IPI):</strong> nada — o pedido é gratuito.
                  </li>
                  <li>
                    <strong className="text-txt">{uf}:</strong>{' '}
                    {rule.icms.taxaPrevia.existe
                      ? `${rule.icms.taxaPrevia.nome ?? 'taxa estadual'}${rule.icms.taxaPrevia.valor ? ` (${BRL.format(rule.icms.taxaPrevia.valor)})` : ''} — precisa estar paga antes do protocolo.`
                      : 'sem taxa estadual antes do protocolo (confirmado ou não cobrada).'}
                  </li>
                  <li>
                    <strong className="text-txt">Em todo o Brasil:</strong> IPVA/multas em aberto travam o pedido —
                    quite antes de protocolar.
                  </li>
                </ul>
              </section>

              <section aria-labelledby="mapa-pericia" className="rounded-card border border-line bg-surface p-6 shadow-card-light">
                <h2 id="mapa-pericia" className="flex items-center gap-2 text-h3 font-medium text-txt">
                  <Stethoscope className="h-5 w-5 text-accent" aria-hidden="true" />
                  Laudo e perícia
                </h2>
                <p className="mt-3 text-small text-txt-2">
                  {rule.pericia.orgao
                    ? `Em ${uf}: ${rule.pericia.orgao}${rule.pericia.custo ? ` · ${BRL.format(rule.pericia.custo)}` : ''}${rule.pericia.validadeDias ? ` · laudo válido por ${Math.round(rule.pericia.validadeDias / 365) >= 1 ? `${Math.round(rule.pericia.validadeDias / 365)} ano(s)` : `${rule.pericia.validadeDias} dias`}` : ''}.`
                    : 'Valem laudos do serviço público de saúde, conveniados SUS, Detran/credenciadas ou serviço social autônomo.'}{' '}
                  O laudo precisa ter CID e conclusão funcional — só o CID sozinho é a principal causa de recusa.
                </p>
              </section>

              <section aria-labelledby="mapa-prazos" className="rounded-card border border-line bg-surface p-6 shadow-card-light">
                <h2 id="mapa-prazos" className="flex items-center gap-2 text-h3 font-medium text-txt">
                  <Timer className="h-5 w-5 text-accent" aria-hidden="true" />
                  Prazos que não podem estourar
                </h2>
                <ul className="mt-3 flex flex-col gap-2 text-small text-txt-2">
                  {prazos.map((p) => (
                    <li key={p.label} className="flex items-baseline justify-between gap-4 border-b border-line/60 pb-2 last:border-0 last:pb-0">
                      <span>{p.label}</span>
                      <strong className="whitespace-nowrap font-mono text-txt">{p.valor}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Armadilhas + lacunas 🔴 */}
            {(rule.notes.length > 0 || rule.verificarComOrgao.length > 0) && (
              <section aria-labelledby="mapa-atencao" className="rounded-card border border-line bg-surface p-6 shadow-card-light lg:p-8">
                <h2 id="mapa-atencao" className="flex items-center gap-2 text-h3 font-medium text-txt">
                  <ClipboardList className="h-5 w-5 text-accent" aria-hidden="true" />
                  Pontos de atenção em {uf}
                </h2>
                {rule.notes.length > 0 && (
                  <ul className="mt-3 flex list-disc flex-col gap-2 pl-6 text-small text-txt-2">
                    {rule.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
                {rule.verificarComOrgao.length > 0 && (
                  <div className="mt-4 rounded-input border border-line bg-bg-alt/60 p-4">
                    <p className="text-small font-bold text-txt">
                      Em confirmação oficial — a gente valida com você, não chuta:
                    </p>
                    <ul className="mt-2 flex list-disc flex-col gap-1 pl-6 text-small text-txt-2">
                      {rule.verificarComOrgao.map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-accent px-4 text-small font-bold text-accent transition-colors hover:bg-accent/10"
                    >
                      Confirmar com a gente no WhatsApp
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </section>
            )}

            {/* Confirmação da leitura = fim da etapa 2 */}
            <section aria-labelledby="mapa-fim" className="rounded-card border border-accent/40 bg-accent/5 p-6 lg:p-8">
              <h2 id="mapa-fim" className="text-h3 font-medium text-txt">Fim desta etapa</h2>
              {mapaDone ? (
                <div className="mt-3 flex flex-col items-start gap-3">
                  <p className="flex items-center gap-2 text-body font-bold text-success">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    Mapa lido e entendido — etapa concluída!
                  </p>
                  <Link
                    to="/app/documentos"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-4 text-small font-bold text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    Ir para a trilha de documentos
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : depPendente ? (
                <div className="mt-3 flex flex-col items-start gap-3">
                  <p className="text-small text-txt-2">
                    Antes de concluir o mapa, falta a pré-análise de 2 minutos — é ela que diz se você tem direito.
                  </p>
                  <Link
                    to="/pre-analise"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-4 text-small font-bold text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    Fazer pré-análise grátis
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <div className="mt-3 flex flex-col items-start gap-3">
                  <p className="text-small text-txt-2">
                    Leu tudo com calma? Ao confirmar, a etapa 2 se conclui e a trilha de documentos do seu estado
                    já nasce pronta na etapa 3.
                  </p>
                  <button
                    type="button"
                    disabled={confirmar.isPending}
                    onClick={() =>
                      confirmar.mutate(
                        { stageKey: 'mapa', status: 'done' },
                        { onSuccess: () => navigate('/app/documentos') },
                      )
                    }
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-accent px-5 text-body font-bold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
                  >
                    <MapIcon className="h-5 w-5" aria-hidden="true" />
                    {confirmar.isPending ? 'Confirmando…' : 'Li e entendi meu mapa'}
                  </button>
                  {confirmar.isError && (
                    <p role="alert" className="text-small text-danger">
                      Não conseguimos confirmar agora. Tente de novo ou chame a gente no WhatsApp.
                    </p>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import TrustBadge, { type TrustLevel } from '@/components/TrustBadge'
import LeadCapture from '@/components/guia/LeadCapture'
import { WHATSAPP_URL, formatBRL } from '@/lib/constants'
import { UF_LIST, UF_MATRIX, type Confidence, type IpvaType, type Uf } from '@contracts/constants'
import { cn } from '@/lib/utils'

export const UF_NOMES: Record<Uf, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
}

/** Posições (coluna, linha) do mapa-cartograma em grade — esquemático, não geográfico. */
const TILE_POS: Record<Uf, [number, number]> = {
  RR: [1, 0], AP: [3, 0],
  AM: [1, 1], PA: [3, 1], MA: [4, 1],
  AC: [0, 2], RO: [1, 2], TO: [3, 2], PI: [4, 2], CE: [5, 2], RN: [6, 2],
  MT: [1, 3], GO: [2, 3], DF: [3, 3], BA: [4, 3], PE: [5, 3], PB: [6, 3],
  MS: [1, 4], MG: [3, 4], ES: [4, 4], AL: [6, 4],
  PR: [2, 5], SP: [3, 5], RJ: [4, 5], SE: [6, 5],
  SC: [2, 6],
  RS: [2, 7],
}

const TILE_W = 58
const TILE_H = 46
const GAP = 6
const MAP_W = 7 * (TILE_W + GAP) - GAP
const MAP_H = 8 * (TILE_H + GAP) - GAP

export const IPVA_TIPO_LABEL: Record<IpvaType, string> = {
  full: 'Isenção total',
  partial: 'Isenção parcial',
  discount60: 'Desconto de 60% — não é isenção total',
  restricted: 'Regra restrita em 2026',
  none: 'Sem isenção',
  unknown: 'Regra a confirmar com o órgão',
}

function trustOf(confidence: Confidence): TrustLevel {
  return confidence === 'check_org' ? 'check' : confidence
}

function fmtMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function validadeLaudo(dias: number | null): string | null {
  if (dias === null) return null
  const anos = Math.round(dias / 365)
  return anos >= 1 ? `${anos} ${anos === 1 ? 'ano' : 'anos'}` : `${dias} dias`
}

/** Painel lateral com o resumo da UF selecionada (guia.md G3). */
function UfPanel({ uf }: { uf: Uf }) {
  const entry = UF_MATRIX[uf]
  const { icms, ipva, pericia } = entry
  const validade = validadeLaudo(pericia.validadeDias)

  return (
    <div className="rounded-card border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-h3 font-medium">
          {UF_NOMES[uf]} <span className="font-mono text-mono text-txt-2">({uf})</span>
        </h3>
        <TrustBadge level={trustOf(entry.confidence)} />
      </div>

      {/* ICMS */}
      <div className="mt-6">
        <h4 className="flex flex-wrap items-center gap-2 font-mono text-xs font-medium uppercase tracking-wider text-accent">
          ICMS (compra do carro 0 km)
          <TrustBadge level={trustOf(icms.confidence)} />
        </h4>
        <ul className="mt-3 space-y-2 text-small text-txt-2">
          <li>
            Isenção total até{' '}
            <strong className="font-mono text-txt">{formatBRL(icms.tetoIntegral ?? 70000)}</strong>
            {icms.tetoParcial ? (
              <>
                {' '}· parcial até{' '}
                <strong className="font-mono text-txt">{formatBRL(icms.tetoParcial)}</strong>
              </>
            ) : null}
          </li>
          {icms.sistema && (
            <li>
              Onde pedir:{' '}
              {icms.sistemaUrl ? (
                <a
                  href={icms.sistemaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-txt underline underline-offset-4 hover:text-accent"
                >
                  {icms.sistema}
                </a>
              ) : (
                <span className="text-txt">{icms.sistema}</span>
              )}
            </li>
          )}
          <li>
            Taxa prévia:{' '}
            {icms.taxaPrevia.existe ? (
              <span className="text-txt">
                {icms.taxaPrevia.nome}
                {icms.taxaPrevia.valor !== null
                  ? ` — ${fmtMoeda(icms.taxaPrevia.valor)}`
                  : ' — valor a confirmar com a SEFAZ'}
              </span>
            ) : (
              <span className="text-txt">
                nenhuma identificada{icms.taxaPrevia.nome ? ` (${icms.taxaPrevia.nome})` : ''}
              </span>
            )}
          </li>
          <li>
            Autorização válida por{' '}
            <strong className="font-mono text-txt">{icms.autorizacaoDias} dias</strong>
          </li>
          <li>
            Síndrome de Down sem exigir IPI antes:{' '}
            <strong className="text-txt">{icms.excecaoDown ? 'sim' : 'não — exige IPI antes'}</strong>
          </li>
        </ul>
      </div>

      {/* IPVA */}
      <div className="mt-6 border-t border-line pt-6">
        <h4 className="flex flex-wrap items-center gap-2 font-mono text-xs font-medium uppercase tracking-wider text-accent">
          IPVA (todo ano)
          <TrustBadge level={trustOf(ipva.confidence)} />
        </h4>
        {ipva.tipo === 'unknown' || ipva.confidence === 'check_org' ? (
          <p className="mt-3 text-small text-txt-2">
            A regra de IPVA de {uf} não está confirmada em fonte oficial.{' '}
            <span className="text-txt">Confirme com a SEFAZ-{uf}</span> antes de decidir — ou fale
            com a gente no WhatsApp.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-small text-txt-2">
            <li className="text-txt">{IPVA_TIPO_LABEL[ipva.tipo]}</li>
            <li>
              Teto:{' '}
              <strong className="font-mono text-txt">
                {ipva.teto !== null ? formatBRL(ipva.teto) : 'sem teto de valor'}
              </strong>
            </li>
            {ipva.prazoPosCompraDias !== null && (
              <li>
                Pedir até{' '}
                <strong className="font-mono text-txt">{ipva.prazoPosCompraDias} dias</strong> após
                a compra
              </li>
            )}
            <li>
              Renovação anual:{' '}
              <strong className="text-txt">{ipva.renovacaoAnual ? 'sim — atenção ao prazo' : 'não'}</strong>
            </li>
            {ipva.lei && <li>Base legal: {ipva.lei}</li>}
          </ul>
        )}
      </div>

      {/* Perícia */}
      {pericia.orgao && (
        <div className="mt-6 border-t border-line pt-6">
          <h4 className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
            Perícia / laudo
          </h4>
          <ul className="mt-3 space-y-2 text-small text-txt-2">
            <li>{pericia.orgao}</li>
            {pericia.custo !== null && (
              <li>
                Custo: <strong className="font-mono text-txt">{fmtMoeda(pericia.custo)}</strong>
              </li>
            )}
            {validade && (
              <li>
                Validade do laudo: <strong className="font-mono text-txt">{validade}</strong>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Observações */}
      {entry.notes.length > 0 && (
        <div className="mt-6 border-t border-line pt-6">
          <h4 className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
            Atenção
          </h4>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-small text-txt-2 marker:text-accent">
            {entry.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Lacunas 🔴 — nunca como fato */}
      {entry.verificarComOrgao.length > 0 && (
        <div className="mt-6 rounded-card border border-danger/50 bg-danger/[.07] p-4">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-danger">
            Confirme com a SEFAZ-{uf}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-txt-2 marker:text-danger">
            {entry.verificarComOrgao.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-whatsapp-dark px-4 text-small font-medium text-white transition-colors hover:brightness-110"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            A gente confirma para você no WhatsApp
          </a>
        </div>
      )}

      <div className="mt-6 border-t border-line pt-6">
        <LeadCapture uf={uf} cta={`Receber o mapa completo de ${uf}`} />
      </div>
    </div>
  )
}

/** Tabela acessível com os dados das 27 UFs (dentro de <details>). */
function UfTable() {
  return (
    <details className="mt-8 rounded-card border border-line bg-surface">
      <summary className="min-h-[56px] cursor-pointer px-6 py-4 text-body font-medium text-txt">
        Ver dados em tabela
      </summary>
      <div className="overflow-x-auto px-6 pb-6">
        <table className="w-full min-w-[760px] border-collapse text-left text-small">
          <caption className="sr-only">
            Resumo das regras de ICMS e IPVA para pessoas com deficiência nas 27 unidades da
            federação
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-3 pr-4 font-mono text-xs uppercase tracking-wider text-txt-2">UF</th>
              <th scope="col" className="py-3 pr-4 font-mono text-xs uppercase tracking-wider text-txt-2">ICMS — teto</th>
              <th scope="col" className="py-3 pr-4 font-mono text-xs uppercase tracking-wider text-txt-2">Taxa prévia</th>
              <th scope="col" className="py-3 pr-4 font-mono text-xs uppercase tracking-wider text-txt-2">IPVA</th>
              <th scope="col" className="py-3 pr-4 font-mono text-xs uppercase tracking-wider text-txt-2">Teto IPVA</th>
              <th scope="col" className="py-3 font-mono text-xs uppercase tracking-wider text-txt-2">Confiança</th>
            </tr>
          </thead>
          <tbody>
            {UF_LIST.map((uf, i) => {
              const e = UF_MATRIX[uf]
              return (
                <tr key={uf} className={cn('border-b border-line/50', i % 2 === 0 ? 'bg-ink-800' : 'bg-ink-900')}>
                  <th scope="row" className="py-3 pr-4 font-mono text-mono text-txt">{uf}</th>
                  <td className="py-3 pr-4 text-txt-2">
                    {formatBRL(e.icms.tetoIntegral ?? 70000)}
                    {e.icms.tetoParcial ? ` / ${formatBRL(e.icms.tetoParcial)}` : ''}
                  </td>
                  <td className="py-3 pr-4 text-txt-2">
                    {e.icms.taxaPrevia.existe
                      ? `${e.icms.taxaPrevia.nome ?? 'Sim'}${e.icms.taxaPrevia.valor !== null ? ` (${fmtMoeda(e.icms.taxaPrevia.valor)})` : ' — valor a confirmar'}`
                      : 'Não identificada'}
                  </td>
                  <td className="py-3 pr-4 text-txt-2">{IPVA_TIPO_LABEL[e.ipva.tipo]}</td>
                  <td className="py-3 pr-4 text-txt-2">
                    {e.ipva.confidence === 'check_org' || e.ipva.tipo === 'unknown'
                      ? 'Confirme com a SEFAZ'
                      : e.ipva.teto !== null
                        ? formatBRL(e.ipva.teto)
                        : 'Sem teto'}
                  </td>
                  <td className="py-3">
                    <TrustBadge level={trustOf(e.confidence)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </details>
  )
}

/**
 * Mapa-cartograma das 27 UFs (guia.md G3): tiles clicáveis + select espelho
 * para teclado/leitor de tela + painel com o resumo da UF + tabela acessível.
 */
export default function UfMap() {
  const [uf, setUf] = useState<Uf>('SP')

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div>
          <svg
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            role="group"
            aria-label="Mapa esquemático do Brasil: selecione um estado para ver as regras"
            className="w-full max-w-[460px]"
          >
            {UF_LIST.map((sigla) => {
              const [col, row] = TILE_POS[sigla]
              const x = col * (TILE_W + GAP)
              const y = row * (TILE_H + GAP)
              const selected = sigla === uf
              return (
                <g
                  key={sigla}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={`${UF_NOMES[sigla]} (${sigla})`}
                  onClick={() => setUf(sigla)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setUf(sigla)
                    }
                  }}
                  className="cursor-pointer rounded-[10px] transition-[fill] duration-200 focus-visible:outline-[3px] focus-visible:outline-accent"
                >
                  <rect
                    x={x}
                    y={y}
                    width={TILE_W}
                    height={TILE_H}
                    rx={10}
                    className={cn(
                      'transition-colors duration-200',
                      selected
                        ? 'fill-amber-400'
                        : 'fill-ink-700 hover:fill-moss-400/30 hover:stroke-amber-400',
                    )}
                    strokeWidth={selected ? 0 : 1.5}
                  />
                  <text
                    x={x + TILE_W / 2}
                    y={y + TILE_H / 2 + 5}
                    textAnchor="middle"
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none font-mono text-mono font-medium',
                      selected ? 'fill-ink-950' : 'fill-paper-50',
                    )}
                  >
                    {sigla}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Espelho acessível do mapa (teclado / leitor de tela) */}
          <div className="mt-6">
            <label htmlFor="uf-select" className="block text-small text-txt-2">
              Prefere escolher na lista? Selecione seu estado:
            </label>
            <select
              id="uf-select"
              value={uf}
              onChange={(e) => setUf(e.target.value as Uf)}
              className="mt-2 min-h-[52px] w-full max-w-[320px] rounded-input border border-line bg-surface px-4 text-body text-txt"
            >
              {UF_LIST.map((sigla) => (
                <option key={sigla} value={sigla}>
                  {UF_NOMES[sigla]} ({sigla})
                </option>
              ))}
            </select>
          </div>
        </div>

        <UfPanel uf={uf} />
      </div>

      <UfTable />
    </div>
  )
}

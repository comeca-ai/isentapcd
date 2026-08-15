import Secao from '@/components/guia/Secao'
import Glossario from '@/components/guia/Glossario'
import { AlertaArmadilha, FonteOficial, ExemploReal } from '@/components/guia/boxes'
import TrustBadge from '@/components/TrustBadge'
import { UF_LIST, UF_MATRIX } from '@contracts/constants'
import { cn } from '@/lib/utils'

/** Tabela das 27 UFs com TrustBadge por linha (dados: contracts/UF_MATRIX). */
function TabelaUfIcms() {
  return (
    <div className="overflow-x-auto rounded-card border border-line">
      <table className="w-full min-w-[720px] border-collapse text-left text-small">
        <caption className="sr-only">
          Regras de ICMS para pessoa com deficiência por estado: sistema de pedido, taxa prévia,
          validade da autorização e nível de confiança do dado
        </caption>
        <thead>
          <tr className="border-b border-line bg-ink-800">
            <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">UF</th>
            <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">Onde pedir</th>
            <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">Taxa prévia</th>
            <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">Validade</th>
            <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">Confiança</th>
          </tr>
        </thead>
        <tbody>
          {UF_LIST.map((uf, i) => {
            const e = UF_MATRIX[uf]
            return (
              <tr key={uf} className={cn('border-b border-line/50', i % 2 === 0 ? 'bg-ink-800' : 'bg-ink-900')}>
                <th scope="row" className="px-4 py-3 font-mono text-mono text-txt">{uf}</th>
                <td className="px-4 py-3 text-txt-2">
                  {e.icms.sistema ?? `Confirme com a SEFAZ-${uf}`}
                </td>
                <td className="px-4 py-3 text-txt-2">
                  {e.icms.taxaPrevia.existe
                    ? `${e.icms.taxaPrevia.nome ?? 'Sim'}${
                        e.icms.taxaPrevia.valor !== null
                          ? ` (${e.icms.taxaPrevia.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
                          : ' — valor a confirmar'
                      }`
                    : e.icms.taxaPrevia.nome
                      ? `Não confirmada (${e.icms.taxaPrevia.nome})`
                      : 'Não'}
                </td>
                <td className="px-4 py-3 font-mono text-mono text-txt-2">{e.icms.autorizacaoDias} dias</td>
                <td className="px-4 py-3">
                  <TrustBadge level={e.icms.confidence === 'check_org' ? 'check' : e.icms.confidence} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Conteúdo do capítulo ICMS (dossiê §3 e §4). */
export default function IcmsContent() {
  return (
    <>
      <Secao id="o-que-e" numero="1" titulo="O que é a isenção de ICMS">
        <p>
          O ICMS é o imposto do seu estado sobre a circulação de mercadorias — e pesa no preço do
          carro. O Convênio ICMS 38/2012 (do CONFAZ, o conselho dos estados) garante à pessoa com
          deficiência a isenção desse imposto na compra do carro 0 km. Cada estado internalizou o
          convênio com seu decreto e seu sistema — por isso os detalhes mudam de UF para UF.
        </p>
        <p>
          A vigência do convênio vai até{' '}
          <strong className="font-mono">31/12/2026</strong> (prorrogação pelo Convênio ICMS
          21/2026). Quem protocola dentro do regime atual garante as regras de hoje.
        </p>
        <FonteOficial
          nome="Convênio ICMS 38/2012 consolidado"
          url="https://www.legisweb.com.br/legislacao/?legislacao=240081"
          verificadoEm="ago/2026"
        />
      </Secao>

      <Secao id="tetos" numero="2" titulo="Tetos: R$ 70 mil e R$ 120 mil">
        <ul className="list-disc space-y-2 pl-5 marker:text-accent">
          <li>
            Até <strong className="font-mono">R$ 70.000</strong>: isenção <strong>total</strong> do
            ICMS.
          </li>
          <li>
            De R$ 70.000,01 até <strong className="font-mono">R$ 120.000</strong>: isenção{' '}
            <strong>parcial</strong> — vale só sobre a parcela de R$ 70 mil (regra desde 01/01/2024,
            Convênio ICMS 147/2023).
          </li>
          <li>
            Acima de R$ 120.000: sem isenção de ICMS. E é proibido fracionar a nota fiscal para
            "caber no teto".
          </li>
        </ul>
        <ExemploReal titulo="Exemplo real — carro de R$ 85.000 em MG (alíquota 12%)">
          <p>ICMS sem isenção: 12% sobre R$ 85.000 ≈ R$ 10.200</p>
          <p>Com isenção parcial: 12% sobre a parcela de R$ 70.000 ≈ R$ 8.400 economizados</p>
          <p>Você paga ICMS só sobre R$ 15.000 (o excedente).</p>
        </ExemploReal>
        <p className="text-small">
          Alíquotas internas variam por estado (12% em SP, MG, RJ, RS; até 23% no MA) e vêm de
          tabelas setoriais <TrustBadge level="secondary" /> — confirme a alíquota no RICMS do seu
          estado antes de calcular a economia exata.
        </p>
      </Secao>

      <Secao id="regras-nacionais" numero="3" titulo="Regras que valem em todo o Brasil">
        <ul className="list-disc space-y-2 pl-5 marker:text-accent">
          <li>
            <strong>IPI deferido antes</strong> (desde 2021). Exceção: Síndrome de Down pode pedir
            junto — <strong>menos em SP</strong>, que exige IPI para todos.
          </li>
          <li>
            A autorização do ICMS vale por{' '}
            <strong className="font-mono">180 dias</strong> (em SP, 270 dias pelo procedimento
            próprio).
          </li>
          <li>
            A nota fiscal precisa ser apresentada ao fisco até o{' '}
            <strong className="font-mono">15º dia útil</strong> do mês seguinte à compra.
          </li>
          <li>
            <strong>Sem débitos</strong> com a fazenda estadual: IPVA, multas e taxas em aberto
            bloqueiam o pedido.
          </li>
          <li>
            Carro registrado <strong>no nome da pessoa com deficiência</strong>, com até 3
            condutores autorizados na mesma localidade.
          </li>
          <li>
            <Glossario termo="carência">Carência</Glossario> de{' '}
            <strong className="font-mono">4 anos</strong>: vender antes gera recolhimento
            proporcional do imposto.
          </li>
          <li>1 veículo por beneficiário no período; adaptação pode ser faturada em até 270 dias após a compra.</li>
        </ul>
        <AlertaArmadilha>
          IPVA ou multa em aberto trava o pedido de ICMS em qualquer estado. Quite suas guias ANTES
          de protocolar — essa é a causa mais boba de indeferimento.
        </AlertaArmadilha>
      </Secao>

      <Secao id="taxas-por-estado" numero="4" titulo="Taxas e sistemas por estado">
        <p>
          O pedido federal (IPI) é gratuito. Nos estados, a maioria não cobra taxa prévia — mas há
          exceções importantes:
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-accent">
          <li>
            <strong>SP:</strong> sem guia antes do protocolo; o único custo é a perícia no IMESC
            (7 UFESP ={' '}
            <strong className="font-mono">R$ 268,94</strong> em 2026), paga à clínica no dia. Pedido
            no sistema SIVEI. <TrustBadge level="official" />
          </li>
          <li>
            <strong>RJ:</strong> exige a TSE de{' '}
            <strong className="font-mono">R$ 279,72</strong> via DARJ antes da análise (valor
            sujeito a atualização). <TrustBadge level="secondary" />
          </li>
          <li>
            <strong>SC:</strong> o DARE da taxa do TTD é condição de análise — sem ele pago, o
            pedido nem é analisado. Valor de 2026 a confirmar com a SEF/SC.{' '}
            <TrustBadge level="check" />
          </li>
          <li>
            <strong>MS:</strong> exige a DAEMS. <TrustBadge level="secondary" />
          </li>
          <li>
            <strong>Demais UFs:</strong> nenhuma taxa prévia localizada em fonte oficial — mas
            confirme com a SEFAZ do seu estado, porque guias e valores mudam.
          </li>
        </ul>
      </Secao>

      <Secao id="tabela-por-uf" numero="5" titulo="Tabela das 27 UFs">
        <p>
          Cada linha traz o sistema oficial de pedido e o nível de confiança do dado. Onde aparece
          "Verificar com o órgão", a informação não está cravada em fonte oficial — trate como
          ponto a confirmar, nunca como fato.
        </p>
        <TabelaUfIcms />
        <p className="text-small">
          Quer o detalhe do seu estado com IPVA, prazos e armadilhas? Veja o{' '}
          <a href="/guia#por-estado">mapa por estado</a> no hub do guia.
        </p>
      </Secao>
    </>
  )
}

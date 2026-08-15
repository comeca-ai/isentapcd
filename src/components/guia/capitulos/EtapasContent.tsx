import Secao from '@/components/guia/Secao'
import Glossario from '@/components/guia/Glossario'
import { AlertaArmadilha } from '@/components/guia/boxes'

const CHECKLIST = [
  'Confirmar elegibilidade (tipo de deficiência + laudo no padrão)',
  'Quitar IPVA, multas e taxas em aberto',
  'Pedir a isenção de IPI no SISEN (grátis, com a sua conta Gov.br)',
  'Receber a autorização do IPI (válida por 270 dias)',
  'Pedir a isenção de ICMS na SEFAZ do seu estado (válida por 180 dias; SP: 270)',
  'Fazer a perícia/laudo estadual quando exigida (ex.: IMESC em SP)',
  'Escolher o carro dentro dos tetos (IPI: R$ 200 mil · ICMS: 70/120 mil)',
  'Comprar com a nota fiscal em nome da pessoa com deficiência, com o desconto destacado',
  'Apresentar a NF ao fisco estadual até o 15º dia útil do mês seguinte',
  'Pedir a isenção de IPVA no prazo do seu estado',
  'Anotar as carências: 2 anos (venda, IPI) · 3 anos (nova isenção, IPI) · 4 anos (ICMS)',
]

/** Conteúdo do capítulo Etapas (jornada em 7 etapas + checklist imprimível). */
export default function EtapasContent() {
  return (
    <>
      <Secao id="visao-geral" numero="1" titulo="Visão geral do caminho">
        <p>
          O caminho tem uma ordem que não pode ser invertida: primeiro o federal (IPI), depois o
          estadual (ICMS), e só então a compra — porque o desconto precisa sair na nota fiscal. O
          IPVA é pedido depois, no prazo do seu estado.
        </p>
      </Secao>

      <Secao id="as-7-etapas" numero="2" titulo="As 7 etapas em detalhe">
        <ol className="list-decimal space-y-4 pl-5 marker:font-mono marker:text-accent">
          <li>
            <strong>Descubra se você tem direito.</strong> Tipo de deficiência, laudo no padrão e
            débitos quitados. A <a href="/pre-analise">pré-análise grátis</a> faz isso em 2 minutos.
          </li>
          <li>
            <strong>Organize os documentos.</strong> Documento de identidade, CPF, laudo (com
            conclusão funcional), CNH (se condutor) e comprovantes. Sem débitos de IPVA ou multas.
          </li>
          <li>
            <strong>Peça a isenção de IPI no <Glossario termo="sisen">SISEN</Glossario>.</strong>{' '}
            Gratuito, online, com a sua conta Gov.br. Análise em cerca de 3 dias úteis.
          </li>
          <li>
            <strong>Receba a autorização federal.</strong> A "carta de isenção" vale por{' '}
            <strong className="font-mono">270 dias</strong>.
          </li>
          <li>
            <strong>Peça a isenção de ICMS no seu estado.</strong> Sistema e taxas variam por UF —
            veja a <a href="/guia/icms">tabela do capítulo de ICMS</a>. Autorização válida por{' '}
            <strong className="font-mono">180 dias</strong> (SP: 270).
          </li>
          <li>
            <strong>Compre o carro.</strong> Nota fiscal no nome da pessoa com deficiência, com os
            descontos destacados e a citação das autorizações. Adaptações podem ser faturadas em até
            270 dias após a compra.
          </li>
          <li>
            <strong>Garanta o IPVA e os prazos seguintes.</strong> Pedido de IPVA no prazo do seu
            estado (SP: 30 dias da NF para carro novo), NF apresentada ao fisco até o 15º dia útil e
            carências anotadas.
          </li>
        </ol>
      </Secao>

      <Secao id="prazos" numero="3" titulo="Os prazos que você não pode perder">
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[520px] border-collapse text-left text-small">
            <caption className="sr-only">Prazos das isenções de IPI, ICMS e IPVA</caption>
            <thead>
              <tr className="border-b border-line bg-ink-800">
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">Prazo</th>
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">O quê</th>
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">Detalhe</th>
              </tr>
            </thead>
            <tbody className="text-txt-2">
              <tr className="border-b border-line/50 bg-ink-800">
                <td className="px-4 py-3 font-mono text-mono text-txt">270 dias</td>
                <td className="px-4 py-3">Validade da autorização de IPI</td>
                <td className="px-4 py-3">A compra precisa acontecer dentro dela</td>
              </tr>
              <tr className="border-b border-line/50 bg-ink-900">
                <td className="px-4 py-3 font-mono text-mono text-txt">180 dias</td>
                <td className="px-4 py-3">Validade da autorização de ICMS</td>
                <td className="px-4 py-3">SP usa 270 dias no procedimento próprio</td>
              </tr>
              <tr className="border-b border-line/50 bg-ink-800">
                <td className="px-4 py-3 font-mono text-mono text-txt">15º dia útil</td>
                <td className="px-4 py-3">Apresentação da NF ao fisco estadual</td>
                <td className="px-4 py-3">Do mês seguinte à emissão</td>
              </tr>
              <tr className="border-b border-line/50 bg-ink-900">
                <td className="px-4 py-3 font-mono text-mono text-txt">30 dias</td>
                <td className="px-4 py-3">Pedido de IPVA em SP (carro novo)</td>
                <td className="px-4 py-3">Contados da nota fiscal</td>
              </tr>
              <tr className="border-b border-line/50 bg-ink-800">
                <td className="px-4 py-3 font-mono text-mono text-txt">2 / 3 / 4 anos</td>
                <td className="px-4 py-3">Carências</td>
                <td className="px-4 py-3">Venda (IPI) · nova isenção (IPI) · ICMS</td>
              </tr>
            </tbody>
          </table>
        </div>
        <AlertaArmadilha>
          Autorização expirada = recomeçar o pedido do zero. Se a carta do IPI vencer antes da
          compra, você perde a fila e o tempo — planeje a compra dentro dos 270 dias.
        </AlertaArmadilha>
      </Secao>

      <Secao id="checklist" numero="4" titulo="Checklist para imprimir">
        <ul className="list-disc space-y-2 pl-5 marker:text-accent print:text-black">
          {CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-5 text-small font-medium text-txt transition-colors hover:border-accent hover:text-accent print:hidden"
        >
          Imprimir checklist
        </button>
      </Secao>
    </>
  )
}

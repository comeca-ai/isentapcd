import Secao from '@/components/guia/Secao'
import Glossario from '@/components/guia/Glossario'
import { AlertaArmadilha } from '@/components/guia/boxes'
import TrustBadge from '@/components/TrustBadge'

/** Conteúdo do capítulo IPVA (dossiê §4, com honestidade explícita). */
export default function IpvaContent() {
  return (
    <>
      <Secao id="o-que-e" numero="1" titulo="O que é a isenção de IPVA">
        <p>
          O IPVA é o imposto anual sobre o veículo, cobrado pelo estado. Diferente do IPI e do ICMS
          (que têm regra nacional), <strong>cada estado tem sua própria lei de isenção de IPVA</strong> —
          com tetos, prazos e exigências diferentes. É o imposto em que mais vemos promessa errada
          por aí.
        </p>
        <p>
          Duas verdades antes de tudo: a isenção costuma valer para{' '}
          <strong>um veículo por beneficiário</strong> e pode exigir{' '}
          <strong>pedido ou renovação periódica</strong>. Perdeu o prazo, perdeu o ano.
        </p>
      </Secao>

      <Secao id="regras-por-estado" numero="2" titulo="Regras por estado (com honestidade)">
        <p>
          Alguns exemplos reais da nossa matriz — sempre com o nível de confiança do dado. A lista
          completa está no <a href="/guia#por-estado">mapa por estado</a>.
        </p>
        <ul className="list-disc space-y-3 pl-5 marker:text-accent">
          <li>
            <strong>SP:</strong> isenção total até{' '}
            <strong className="font-mono">R$ 70 mil</strong>; entre R$ 70 mil e R$ 120 mil, paga-se
            só sobre o excedente. Exige grau de deficiência moderado, grave ou gravíssimo. Pedido em
            até 30 dias da nota fiscal para carro novo. <TrustBadge level="official" />
          </li>
          <li>
            <strong>SC:</strong> total, com teto de{' '}
            <strong className="font-mono">R$ 200 mil</strong>. <TrustBadge level="official" />
          </li>
          <li>
            <strong>RS:</strong> total, teto de{' '}
            <strong className="font-mono">R$ 144.294,68</strong> (5.094 UPF-RS, carros novos em
            2026). <TrustBadge level="official" />
          </li>
          <li>
            <strong>PR:</strong> total, sem teto de valor — mas com limite de{' '}
            <strong className="font-mono">155 CV</strong> de potência. <TrustBadge level="secondary" />
          </li>
          <li>
            <strong>AM:</strong> total e sem teto desde 01/01/2026 — mas exige{' '}
            <strong>renovação anual obrigatória</strong>. <TrustBadge level="official" />
          </li>
          <li>
            <strong>RJ:</strong> isenção total, porém com teto de{' '}
            <strong className="font-mono">R$ 55 mil</strong> para carros novos nacionais — na
            prática, inviabiliza carro 0 km. É a maior armadilha do Sudeste.{' '}
            <TrustBadge level="secondary" />
          </li>
          <li>
            <strong>MS:</strong> <strong>não é isenção</strong> — é redução de 60% do IPVA (Lei
            1.810/97). Desconfie de quem prometer "IPVA zero" em MS. <TrustBadge level="secondary" />
          </li>
          <li>
            <strong>TO:</strong> isenção <strong>parcial</strong> — vale só na parcela de R$ 70 mil,
            até o teto de R$ 120 mil. <TrustBadge level="official" />
          </li>
          <li>
            <strong>BA, PE, MA, DF, RN, AL, SE:</strong> a regra de IPVA não está cravada em fonte
            oficial acessível. <TrustBadge level="check" /> Confirme com a SEFAZ do seu estado —
            nunca trate como fato o que ler em redes sociais.
          </li>
        </ul>
        <AlertaArmadilha>
          Não existe direito adquirido à isenção de IPVA: o STF (Tema 1.176) decidiu que o estado
          pode mudar os critérios para o futuro. Mantenha os requisitos sempre em dia.
        </AlertaArmadilha>
      </Secao>

      <Secao id="renovacao" numero="3" titulo="Renovação: os estados que exigem">
        <ul className="list-disc space-y-2 pl-5 marker:text-accent">
          <li>
            <strong>AM:</strong> renovação anual obrigatória — quem não renova perde o exercício.
          </li>
          <li>
            <strong>CE:</strong> pedido anual.
          </li>
          <li>
            <strong>MA:</strong> renovação a cada 4 anos, sob pena de perda do benefício.
          </li>
          <li>
            <strong>RR:</strong> laudo com validade de 5 anos (para TEA, indeterminado).
          </li>
        </ul>
        <p>
          Nos demais estados a isenção em geral se mantém sem renovação formal, mas com obrigações
          de comunicar mudanças (em SP, comunicar a cessação em 30 dias). Anote os prazos do seu
          estado — no acompanhamento do IsentaPCD, a gente te lembra deles.
        </p>
      </Secao>

      <Secao id="autista-nao-condutor" numero="4" titulo="Autista não condutor: o que o STJ decidiu">
        <p>
          Em 2019, o STJ (RMS 51.424/RJ) garantiu isenção de IPVA a pessoa autista{' '}
          <Glossario termo="não condutor">não condutora</Glossario>: exigir que a própria pessoa
          dirija o carro é discriminatório. A tese vale como referência em todo o país.
        </p>
        <p>
          Na prática: o carro fica no nome da pessoa com deficiência e os condutores autorizados
          dirigem por ela. Se o seu estado negar o pedido por esse motivo, a decisão do STJ é o
          caminho para reverter — judicialmente, se preciso.
        </p>
      </Secao>
    </>
  )
}

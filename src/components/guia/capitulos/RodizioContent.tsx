import Secao from '@/components/guia/Secao'
import { AlertaArmadilha, FonteOficial } from '@/components/guia/boxes'
import TrustBadge from '@/components/TrustBadge'

/** Conteúdo do capítulo Rodízio e credencial (dossiê §6). */
export default function RodizioContent() {
  return (
    <>
      <Secao id="rodizio-sp" numero="1" titulo="Rodízio em São Paulo">
        <p>
          São Paulo é a única cidade brasileira com rodízio de automóveis ativo — e tem isenção
          para veículo que <strong>conduz ou transporta</strong> pessoa com deficiência, pessoa com
          doença crônica ou em tratamento grave, ou pessoa autista.
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-accent">
          <li>
            O cadastro é feito no <strong>SP156</strong> (serviço "Isenção de rodízio para pessoas
            com deficiência") e vale por até 2 anos; deficiência permanente dispensa novo laudo.
          </li>
          <li>
            O veículo precisa ser licenciado em SP ou na região metropolitana. O rodízio vale de
            7h–10h e 17h–20h, no Anel Viário.
          </li>
          <li>
            Sem o cadastro, circular no horário gera multa (infração média,{' '}
            <strong className="font-mono">R$ 130,16</strong> + 4 pontos), com recurso ao DSV.
          </li>
        </ul>
        <FonteOficial
          nome="Prefeitura de SP — Isenção de rodízio PCD"
          url="https://prefeitura.sp.gov.br/web/mobilidade/w/autorizacoes_especiais/isencao_de_rodizio/271800"
          verificadoEm="ago/2026"
        />
      </Secao>

      <Secao id="credencial-estacionamento" numero="2" titulo="Credencial de estacionamento">
        <p>
          A credencial dá direito a parar nas vagas reservadas (sinalizadas com o símbolo
          internacional de acesso). Existe um <strong>modelo nacional</strong> (Resolução CONTRAN
          965/2022), inclusive digital, emitido pelo serviço "Emitir Credencial de Estacionamento
          Digital" no Gov.br — com validade em todo o país.
        </p>
        <p>
          Em São Paulo, a <strong>Credencial DeFis</strong> (SP156, serviço 3314) é gratuita e dá
          acesso a mais de 1.700 vagas. Nas vagas dentro da Zona Azul é preciso pagar o CAD (o
          tíquete da vaga, <strong className="font-mono">R$ 6,95</strong>); fora da Zona Azul, o uso
          é gratuito. <TrustBadge level="official" />
        </p>
        <FonteOficial
          nome="CET — Vagas DeFis"
          url="https://www.cetsp.com.br/consultas/zona-azul/vagas-especiais/vagas-defis.aspx"
          verificadoEm="ago/2026"
        />
      </Secao>

      <Secao id="outras-capitais" numero="3" titulo="Outras capitais">
        <ul className="list-disc space-y-2 pl-5 marker:text-accent">
          <li>
            <strong>Rio de Janeiro:</strong> cartão de estacionamento PCD pela SMTR/1746 — vale até
            5 anos e tem validade nacional. <TrustBadge level="official" />
          </li>
          <li>
            <strong>Belo Horizonte:</strong> credencial pela BHTrans, com emissão digital.{' '}
            <TrustBadge level="official" />
          </li>
          <li>
            <strong>Porto Alegre, Salvador, Fortaleza, Recife, Brasília, Curitiba:</strong> todas têm
            credencial municipal (a de Brasília inclui credencial específica para pessoa autista).{' '}
            <TrustBadge level="secondary" />
          </li>
          <li>
            <strong>Pedágio:</strong> não existe isenção federal. Paraná e Espírito Santo têm leis
            estaduais de isenção para PCD/TEA em tratamento fora do município.{' '}
            <TrustBadge level="official" />
          </li>
        </ul>
        <AlertaArmadilha>
          Estacionar em vaga reservada sem credencial é infração gravíssima (CTB, art. 181):{' '}
          <strong className="font-mono">R$ 293,47</strong> + 7 pontos na CNH. A credencial vem
          primeiro.
        </AlertaArmadilha>
      </Secao>

      <Secao id="multas" numero="4" titulo="O que acontece sem credencial">
        <p>
          Além da multa gravíssima por parar em vaga reservada sem credencial, rodar no horário de
          rodízio em SP sem o cadastro gera autuação. Os dois cadastros são gratuitos e online —
          não vale o risco.
        </p>
        <p>
          E um aviso honesto: não encontramos isenção de taxa de licenciamento documentada em nenhum
          estado, e o DPVAT foi extinto. Se alguém te vender "isenção de licenciamento", desconfie.{' '}
          <TrustBadge level="secondary" />
        </p>
      </Secao>
    </>
  )
}

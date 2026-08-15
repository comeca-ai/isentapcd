import Secao from '@/components/guia/Secao'
import Glossario from '@/components/guia/Glossario'
import { AlertaArmadilha, FonteOficial, ExemploReal } from '@/components/guia/boxes'
import TrustBadge from '@/components/TrustBadge'

/** Conteúdo do capítulo IPI (dossiê §2). */
export default function IpiContent() {
  return (
    <>
      <Secao id="o-que-e" numero="1" titulo="O que é a isenção de IPI">
        <p>
          O IPI (Imposto sobre Produtos Industrializados) é um imposto federal embutido no preço de
          todo carro 0 km. A Lei nº 8.989/1995 garante à pessoa com deficiência o direito de comprar
          o carro <strong>sem pagar o IPI</strong> — o desconto já vem na nota fiscal, destacado e
          identificado como "ISENTO DO IPI".
        </p>
        <p>
          O pedido é feito pela internet, no <Glossario termo="sisen">SISEN</Glossario> (Sistema de
          Gestão de Benefícios Fiscais), e o serviço é <strong>totalmente gratuito</strong>. Quem
          analisa e decide é sempre a Receita Federal — nenhuma empresa ou despachante "aprova"
          isenção.
        </p>
        <FonteOficial
          nome="Gov.br — Obter isenção de impostos para comprar carro"
          url="https://www.gov.br/pt-br/servicos/obter-isencao-de-impostos-para-comprar-carro"
          verificadoEm="ago/2026"
        >
          Página oficial do serviço: gratuito, online, com a sua conta Gov.br.
        </FonteOficial>
      </Secao>

      <Secao id="quem-tem-direito" numero="2" titulo="Quem tem direito">
        <p>A lei cobre cinco grupos, ainda que a pessoa seja menor de 18 anos:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-accent">
          <li>
            <strong>Deficiência física</strong> — paraplegia, hemiplegia, amputação, paralisia
            cerebral, ostomia, nanismo e outras condições que comprometem a locomoção (critérios do
            Decreto 11.063/2022).
          </li>
          <li>
            <strong>Deficiência visual</strong> — cegueira ou baixa visão dentro dos limites do
            decreto.
          </li>
          <li>
            <strong>Deficiência auditiva</strong> — perda bilateral de 41 dB ou mais (incluída após
            o STF reconhecer a omissão da lei, na ADO 30/DF).
          </li>
          <li>
            <strong>Deficiência mental severa ou profunda</strong> — nos termos do CID-10.
          </li>
          <li>
            <strong>Autismo (TEA)</strong> — CIDs F84.0 e F84.1.
          </li>
        </ul>
        <p>
          Quem não dirige (<Glossario termo="não condutor">não condutor</Glossario>) também tem
          direito: o carro fica no nome da pessoa com deficiência e ela indica pelo menos um
          condutor habilitado. Pais, tutores e curadores podem pedir como{' '}
          <Glossario termo="representante legal">representantes legais</Glossario>.
        </p>
        <AlertaArmadilha>
          Não existe "lista oficial de CIDs" para deficiência física. O que vale é o enquadramento
          funcional — o laudo precisa descrever o impacto da condição na condução ou na mobilidade.
          Listas de CIDs que circulam na internet não são oficiais.
        </AlertaArmadilha>
      </Secao>

      <Secao id="teto" numero="3" titulo="Teto de R$ 200 mil">
        <p>
          A isenção vale para carro 0 km <strong>nacional</strong> de até{' '}
          <strong className="font-mono">R$ 200.000</strong> (preço ao consumidor, já com tributos),
          limite vigente desde 2022. Carro importado não entra.
        </p>
        <p>
          Na prática, o portal aplica também as regras de motor até 2.0 e 4 portas — embora a lei
          diga que esses limites não se aplicam a pessoas com deficiência. É um conflito não
          resolvido: <TrustBadge level="secondary" /> trabalhe com o critério prático da Receita
          para não ter surpresa.
        </p>
        <ExemploReal titulo="Exemplo real — carro de R$ 85.000 (flex)">
          <p>IPI típico (flex, 6,3%): ≈ R$ 5.355</p>
          <p>Com a isenção: R$ 0 — o desconto já aparece na nota fiscal.</p>
        </ExemploReal>
      </Secao>

      <Secao id="sisen-passo-a-passo" numero="4" titulo="SISEN passo a passo">
        <ol className="list-decimal space-y-3 pl-5 marker:font-mono marker:text-accent">
          <li>
            <strong>Entre no SISEN</strong> (sisen.receita.fazenda.gov.br) com a sua conta Gov.br.
            Representante legal entra com a própria conta e marca "Desejo exercer o papel de
            representante legal".
          </li>
          <li>
            <strong>Preencha o requerimento eletrônico</strong>, incluindo a declaração de
            disponibilidade financeira (dispensada se houver financiamento bancário).
          </li>
          <li>
            <strong>Anexe os documentos</strong> ou use o laudo eletrônico emitido dentro do próprio
            SISEN por médico ou psicólogo de serviço de saúde.
          </li>
          <li>
            <strong>Acompanhe a análise</strong>: o resultado aparece após 72h e costuma sair em
            cerca de 3 dias úteis. Se cair em malha, você recebe intimação para complementar.
          </li>
          <li>
            <strong>Pedido deferido</strong> → a Receita emite a{' '}
            <Glossario termo="carta de isenção">Autorização</Glossario>, válida por 270 dias.
          </li>
          <li>
            <strong>Compre o carro</strong> com a nota fiscal no seu nome, com o valor do IPI
            dispensado destacado e a citação da autorização.
          </li>
          <li>
            <strong>Se for negado</strong>, cabe recurso em até 10 dias.
          </li>
        </ol>
        <AlertaArmadilha>
          O IsentaPCD nunca pede sua senha do Gov.br — e ninguém sério pede. Você mesmo acessa o
          SISEN; a gente orienta cada tela.
        </AlertaArmadilha>
        <FonteOficial
          nome="IN RFB nº 1.769/2017 — norma do processo"
          url="http://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=88750"
          verificadoEm="ago/2026"
        >
          É a Instrução Normativa 1.769/2017 que regula o pedido. (Não é o Decreto 9.134/2017 — esse
          trata de acordo diplomático e nada tem a ver com a isenção.)
        </FonteOficial>
      </Secao>

      <Secao id="validade-e-carencia" numero="5" titulo="Validade e carência">
        <p>
          A autorização do IPI vale por <strong className="font-mono">270 dias</strong>: é dentro
          desse prazo que a compra precisa acontecer. Depois da compra, duas datas importam:
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-accent">
          <li>
            <strong>Vender o carro:</strong> antes de{' '}
            <strong className="font-mono">2 anos</strong>, é preciso devolver o IPI integralmente
            (com Selic desde a nota fiscal) e pedir autorização prévia à Receita. Vender para outra
            pessoa com direito pode manter a isenção.
          </li>
          <li>
            <strong>Comprar outro carro com isenção:</strong> o{' '}
            <Glossario termo="interstício">interstício</Glossario> é de{' '}
            <strong className="font-mono">3 anos</strong> entre uma isenção de IPI e a próxima.
          </li>
        </ul>
        <p>
          Atenção: cada imposto tem sua <Glossario termo="carência">carência</Glossario> — no ICMS
          são 4 anos, e a venda antecipada gera devolução proporcional (não integral). O capítulo de{' '}
          <a href="/guia/icms">ICMS</a> explica a diferença.
        </p>
      </Secao>

      <Secao id="decisoes-recentes" numero="6" titulo="Decisões recentes da Justiça">
        <ul className="list-disc space-y-3 pl-5 marker:text-accent">
          <li>
            <strong>STJ (2025) — REsp 2.185.814/RS:</strong> a isenção de IPI não depende de
            restrição na CNH nem de adaptação do veículo. A decisão também reconheceu a visão
            monocular.
          </li>
          <li>
            <strong>STJ (2025) — REsp 1.993.981/PE:</strong> é ilegal negar isenção a pessoa autista
            porque ela recebe BPC/LOAS.
          </li>
          <li>
            <strong>STF (2020) — ADO 30/DF:</strong> incluiu a deficiência auditiva na isenção de
            IPI.
          </li>
        </ul>
        <p>
          O que isso significa na prática: alguns "nãos" do processo administrativo viram "sim" na
          Justiça. Quando esse for o seu caso, a gente avisa com clareza antes de você gastar
          energia — veja o capítulo de <a href="/guia/requisitos">requisitos</a>.
        </p>
      </Secao>
    </>
  )
}

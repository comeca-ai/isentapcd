import Secao from '@/components/guia/Secao'
import { FonteOficial } from '@/components/guia/boxes'
import TrustBadge from '@/components/TrustBadge'

interface Fonte {
  nome: string
  url: string
}

const FEDERAIS: Fonte[] = [
  {
    nome: 'Gov.br — Obter isenção de impostos para comprar carro (SISEN)',
    url: 'https://www.gov.br/pt-br/servicos/obter-isencao-de-impostos-para-comprar-carro',
  },
  {
    nome: 'Receita Federal — Perguntas frequentes sobre isenção para compra de carro',
    url: 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/perguntas-frequentes/isencao-para-compra-de-carro/isencao-para-compra-de-carro',
  },
  {
    nome: 'SISEN — Sistema de Gestão de Benefícios Fiscais',
    url: 'https://sisen.receita.fazenda.gov.br',
  },
  {
    nome: 'Gov.br — Emitir Credencial de Estacionamento Digital',
    url: 'https://www.gov.br/pt-br/servicos/emitir-credencial-de-estacionamento-para-pessoa-com-deficiencia',
  },
]

const LEGISLACAO: Fonte[] = [
  {
    nome: 'Lei nº 8.989/1995 (isenção de IPI; efeitos até 31/12/2026)',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8989.htm',
  },
  {
    nome: 'IN RFB nº 1.769/2017 (processo no SISEN)',
    url: 'http://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=88750',
  },
  {
    nome: 'Decreto 11.063/2022 (critérios por tipo de deficiência)',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/decreto/d11063.htm',
  },
  {
    nome: 'Convênio ICMS 38/2012 consolidado (tetos, carência, regras)',
    url: 'https://www.legisweb.com.br/legislacao/?legislacao=240081',
  },
  {
    nome: 'Lei nº 8.383/1991, art. 72 (isenção de IOF)',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8383.htm',
  },
  {
    nome: 'LC 214/2025 e LC 227/2026 (regime 2027+, IBS/CBS)',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
  },
]

const JURISPRUDENCIA: Fonte[] = [
  {
    nome: 'STF — ADIs 7.779/7.790 (sem filtro de grau no regime 2027+)',
    url: 'https://noticias.stf.jus.br/postsnoticias/stf-afasta-restricao-para-aliquota-zero-na-compra-de-veiculos-por-pessoas-autistas-e-com-deficiencia-intelectual/',
  },
  {
    nome: 'STJ — IPI não depende de restrição na CNH (REsp 2.185.814/RS)',
    url: 'https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2025/13052025-Isencao-de-IPI-para-pessoa-com-deficiencia-nao-depende-de-restricao-na-CNH--decide-Segunda-Turma.aspx',
  },
  {
    nome: 'STJ — ICMS para visão monocular (REsp 2.267.089/DF)',
    url: 'https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2026/08062026-Segunda-Turma-garante-isencao-de-ICMS-na-compra-de-veiculo-por-pessoa-com-visao-monocular.aspx',
  },
  {
    nome: 'STF — ADI 3495/ES (isenção de ICMS é constitucional)',
    url: 'https://noticias.stf.jus.br/postsnoticias/stf-mantem-isencao-de-icms-em-automoveis-para-pessoas-com-deficiencia-no-espirito-santo/',
  },
]

const ESTADUAIS: Fonte[] = [
  {
    nome: 'SP — Guia do usuário ICMS-PCD (Fazenda SP)',
    url: 'https://portal.fazenda.sp.gov.br/servicos/isencao-icms-veiculos/Paginas/PaginaGuiaDoUsuario.aspx',
  },
  {
    nome: 'SP — Portaria CAT 18/2013 consolidada',
    url: 'https://legislacao.fazenda.sp.gov.br/Paginas/pcat182013.aspx',
  },
  {
    nome: 'GO — Isenção de ICMS e IPVA (autista não condutor)',
    url: 'https://goias.gov.br/economia/isencao-de-icms-e-ipva-autista-nao-condutor-2/',
  },
  {
    nome: 'MT — Base oficial de legislação tributária (Sefaz-MT)',
    url: 'http://app1.sefaz.mt.gov.br/sistema/legislacao/legislacaotribut.nsf',
  },
  {
    nome: 'SP — Isenção de rodízio PCD (Prefeitura de SP)',
    url: 'https://prefeitura.sp.gov.br/web/mobilidade/w/autorizacoes_especiais/isencao_de_rodizio/271800',
  },
  {
    nome: 'SP — Credencial DeFis (CET)',
    url: 'https://www.cetsp.com.br/consultas/zona-azul/vagas-especiais/vagas-defis.aspx',
  },
]

function ListaFontes({ fontes }: { fontes: Fonte[] }) {
  return (
    <ul className="space-y-3">
      {fontes.map((f) => (
        <li key={f.url} className="flex flex-wrap items-center gap-3">
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-txt underline underline-offset-4 hover:text-accent"
          >
            {f.nome}
          </a>
          <TrustBadge level="official" />
        </li>
      ))}
    </ul>
  )
}

/** Conteúdo do capítulo Fontes oficiais (dossiê — seção Fontes). */
export default function FontesContent() {
  return (
    <>
      <Secao id="federal" numero="1" titulo="Governo federal">
        <p>
          Todo link desta página foi verificado em <strong>agosto de 2026</strong> e leva ao órgão
          oficial — nunca a intermediário.
        </p>
        <ListaFontes fontes={FEDERAIS} />
      </Secao>

      <Secao id="estaduais" numero="2" titulo="SEFAZ e Detran por estado">
        <p>
          Os sistemas estaduais mudam de nome e de endereço com frequência. Estes são os que
          confirmamos em fonte oficial; para o seu estado específico, veja o{' '}
          <a href="/guia#por-estado">mapa por estado</a>.
        </p>
        <ListaFontes fontes={ESTADUAIS} />
        <FonteOficial
          nome="Portal da SEFAZ do seu estado é sempre a fonte final"
          url="https://www.gov.br/fazenda/pt-br/assuntos/secretarias-especiais"
          verificadoEm="ago/2026"
        >
          Não achou o portal do seu estado? Fale com a gente no WhatsApp que indicamos o endereço
          oficial.
        </FonteOficial>
      </Secao>

      <Secao id="legislacao" numero="3" titulo="Leis e convênios">
        <ListaFontes fontes={LEGISLACAO} />
      </Secao>

      <Secao id="jurisprudencia" numero="4" titulo="Decisões dos tribunais">
        <p>
          As decisões que mais citamos, direto na fonte dos tribunais. A lista completa com as 8
          teses está na home, na seção de prova legal.
        </p>
        <ListaFontes fontes={JURISPRUDENCIA} />
      </Secao>
    </>
  )
}

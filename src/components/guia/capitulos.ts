import type { TrustLevel } from '@/components/TrustBadge'
import type { FaqItem } from '@/components/guia/FaqAccordion'

export interface CapituloSecao {
  id: string
  titulo: string
}

export interface CapituloMeta {
  slug: string
  numero: string
  titulo: string
  resumo: string
  tempoLeitura: string
  trust: TrustLevel
  imagem?: string
  imagemAlt?: string
  atualizadoEm: string
  /** Termos extras para a busca do hub. */
  keywords: string[]
  secoes: CapituloSecao[]
  faq: FaqItem[]
}

const ATUALIZADO = 'agosto de 2026'

export const CAPITULOS: CapituloMeta[] = [
  {
    slug: 'ipi',
    numero: '01',
    titulo: 'IPI — o imposto federal',
    resumo:
      'Quem tem direito, o teto de R$ 200 mil, o passo a passo do SISEN e os 270 dias de validade da autorização.',
    tempoLeitura: '6 min',
    trust: 'official',
    imagem: '/guide-ipi.png',
    imagemAlt:
      'Ilustração de um cofrinho em forma de moeda com o símbolo da Receita Federal, representando a isenção do IPI.',
    atualizadoEm: ATUALIZADO,
    keywords: ['ipi', 'federal', 'sisen', 'receita', 'autorização', 'carta', 'iof', '270 dias', '200 mil'],
    secoes: [
      { id: 'o-que-e', titulo: 'O que é a isenção de IPI' },
      { id: 'quem-tem-direito', titulo: 'Quem tem direito' },
      { id: 'teto', titulo: 'Teto de R$ 200 mil' },
      { id: 'sisen-passo-a-passo', titulo: 'SISEN passo a passo' },
      { id: 'validade-e-carencia', titulo: 'Validade e carência' },
      { id: 'decisoes-recentes', titulo: 'Decisões recentes da Justiça' },
    ],
    faq: [
      {
        q: 'O pedido de isenção de IPI custa alguma coisa?',
        a: 'Não. O serviço na Receita Federal (SISEN) é 100% gratuito. Desconfie de quem cobra "taxa da Receita".',
      },
      {
        q: 'Quanto tempo demora a resposta?',
        a: 'O resultado fica disponível após 72 horas e o tempo médio de análise é de cerca de 3 dias úteis. Se o pedido cair em malha, você recebe uma intimação para complementar.',
      },
      {
        q: 'E se o pedido for negado?',
        a: 'Cabe recurso em até 10 dias, com instâncias sucessivas. A maioria dos indeferimentos vem de laudo incompleto — dá para corrigir e reapresentar.',
      },
      {
        q: 'Quem não dirige pode pedir IPI?',
        a: 'Sim. O não condutor indica pelo menos 1 condutor habilitado. Condutores adicionais são incluídos pelo ChatRFB ("Protocolar Processo"), não pelo SISEN.',
      },
    ],
  },
  {
    slug: 'icms',
    numero: '02',
    titulo: 'ICMS — o imposto do seu estado',
    resumo:
      'Isenção total até R$ 70 mil e parcial até R$ 120 mil, taxas por estado, 180 dias de validade e a tabela das 27 UFs.',
    tempoLeitura: '8 min',
    trust: 'official',
    imagem: '/guide-icms.png',
    imagemAlt:
      'Ilustração de um mapa do Brasil com bandeiras dos estados, representando as regras de ICMS de cada UF.',
    atualizadoEm: ATUALIZADO,
    keywords: ['icms', 'estado', 'sefaz', '70 mil', '120 mil', 'down', '180 dias', 'convênio'],
    secoes: [
      { id: 'o-que-e', titulo: 'O que é a isenção de ICMS' },
      { id: 'tetos', titulo: 'Tetos: R$ 70 mil e R$ 120 mil' },
      { id: 'regras-nacionais', titulo: 'Regras que valem em todo o Brasil' },
      { id: 'taxas-por-estado', titulo: 'Taxas e sistemas por estado' },
      { id: 'tabela-por-uf', titulo: 'Tabela das 27 UFs' },
    ],
    faq: [
      {
        q: 'Preciso da isenção de IPI antes de pedir o ICMS?',
        a: 'Sim, em regra: desde 2021 o ICMS exige o IPI deferido antes. A única exceção é a Síndrome de Down — e mesmo ela não vale em SP, que exige IPI para todos.',
      },
      {
        q: 'A isenção de ICMS vale para carro acima de R$ 120 mil?',
        a: 'Não. Até R$ 70 mil a isenção é total; entre R$ 70 mil e R$ 120 mil ela vale só sobre a parcela de R$ 70 mil (isenção parcial). Acima de R$ 120 mil, não há isenção.',
      },
      {
        q: 'Tenho IPVA ou multa em aberto. Posso pedir?',
        a: 'Não enquanto houver débito. O Convênio ICMS 38/2012 veda a concessão a quem tem débitos com a fazenda estadual — quite IPVA, multas e taxas antes de protocolar.',
      },
      {
        q: 'Posso dividir a nota fiscal para caber no teto?',
        a: 'Não. O fracionamento da nota fiscal é expressamente vedado e invalida o benefício.',
      },
    ],
  },
  {
    slug: 'ipva',
    numero: '03',
    titulo: 'IPVA — todo ano',
    resumo:
      'As regras mudam (muito) por estado: MS é desconto de 60%, TO é parcial e o RJ tem teto que inviabiliza carro 0 km.',
    tempoLeitura: '7 min',
    trust: 'secondary',
    imagem: '/guide-ipva.png',
    imagemAlt:
      'Ilustração de um calendário anual com um carimbo de isenção, representando o IPVA cobrado todo ano.',
    atualizadoEm: ATUALIZADO,
    keywords: ['ipva', 'anual', 'renovação', 'licenciamento', 'desconto', 'matrícula'],
    secoes: [
      { id: 'o-que-e', titulo: 'O que é a isenção de IPVA' },
      { id: 'regras-por-estado', titulo: 'Regras por estado (com honestidade)' },
      { id: 'renovacao', titulo: 'Renovação: os estados que exigem' },
      { id: 'autista-nao-condutor', titulo: 'Autista não condutor: o que o STJ decidiu' },
    ],
    faq: [
      {
        q: 'IPVA isento vale para carro usado?',
        a: 'Depende do estado: RO, AC e AP aceitam usados dentro do teto de valor venal; em SP o usado precisa de pedido antes de 1º de janeiro do exercício. Confirme com a SEFAZ do seu estado.',
      },
      {
        q: 'A isenção de IPVA é automática depois de aprovada?',
        a: 'Na maioria dos estados, sim, mantidos os requisitos. Mas AM exige renovação anual, CE pede solicitação a cada ano e MA cobra renovação a cada 4 anos — perder o prazo é perder o exercício.',
      },
      {
        q: 'Mato Grosso do Sul tem isenção de IPVA?',
        a: 'Não exatamente: MS concede redução de 60% do IPVA (Lei 1.810/97), não isenção total. Desconfie de quem prometer "IPVA zero" em MS.',
      },
    ],
  },
  {
    slug: 'rodizio',
    numero: '04',
    titulo: 'Rodízio e credencial de estacionamento',
    resumo:
      'Como pedir a isenção de rodízio em São Paulo e a credencial de vagas especiais — e onde cada uma vale.',
    tempoLeitura: '5 min',
    trust: 'secondary',
    imagem: '/guide-rodizio.png',
    imagemAlt:
      'Ilustração de uma placa de trânsito com um carro, representando a isenção de rodízio municipal.',
    atualizadoEm: ATUALIZADO,
    keywords: ['rodízio', 'estacionamento', 'credencial', 'defis', 'vaga', 'zona azul', 'sp156'],
    secoes: [
      { id: 'rodizio-sp', titulo: 'Rodízio em São Paulo' },
      { id: 'credencial-estacionamento', titulo: 'Credencial de estacionamento' },
      { id: 'outras-capitais', titulo: 'Outras capitais' },
      { id: 'multas', titulo: 'O que acontece sem credencial' },
    ],
    faq: [
      {
        q: 'A credencial de estacionamento vale em outras cidades?',
        a: 'A credencial no modelo nacional (Res. CONTRAN 965/2022) tem validade nacional. Credenciais municipais antigas costumam valer só na cidade que emitiu.',
      },
      {
        q: 'Existe isenção de rodízio fora de São Paulo?',
        a: 'Não encontramos outra cidade com rodízio de automóveis ativo. Se a sua cidade criar um, vale checar a regra municipal.',
      },
      {
        q: 'A credencial de SP é gratuita?',
        a: 'A Credencial DeFis é gratuita, mas as vagas DeFis dentro da Zona Azul exigem o CAD pago (R$ 6,95). Fora da Zona Azul, as vagas são de uso gratuito.',
      },
    ],
  },
  {
    slug: 'requisitos',
    numero: '05',
    titulo: 'Requisitos — quem tem direito',
    resumo:
      'Condutor, não condutor e representante legal; tipos de deficiência; laudo e CNH; e os casos cinzentos explicados sem promessa.',
    tempoLeitura: '7 min',
    trust: 'official',
    atualizadoEm: ATUALIZADO,
    keywords: ['requisitos', 'quem tem direito', 'deficiência', 'laudo', 'cnh', 'autismo', 'monocular', 'condutor', 'representante'],
    secoes: [
      { id: 'definicao-pcd', titulo: 'Quem a lei considera PCD' },
      { id: 'condutor-nao-condutor', titulo: 'Condutor, não condutor e representante legal' },
      { id: 'laudo', titulo: 'O laudo que funciona' },
      { id: 'cnh', titulo: 'CNH com restrições' },
      { id: 'casos-cinzentos', titulo: 'Casos cinzentos, sem promessa vazia' },
    ],
    faq: [
      {
        q: 'O laudo do meu médico particular serve?',
        a: 'No processo administrativo, não: o laudo precisa vir de serviço público de saúde, serviço conveniado ao SUS, Detran/clínica credenciada ou serviço social autônomo (como APAE). Na Justiça, laudo particular já foi aceito como prova.',
      },
      {
        q: 'Autista nível 1 de suporte tem direito?',
        a: 'Em 2026, o IPI federal cobre deficiência mental severa ou profunda e TEA (F84.0/F84.1), e estados como SP exigem grau moderado ou grave no IPVA. O STF derrubou o filtro de grau apenas no regime novo (2027+). Casos leves em 2026 costumam depender de via judicial — a gente explica isso antes de você decidir.',
      },
      {
        q: 'Tenho visão monocular. Tenho direito?',
        a: 'No administrativo, a Receita nega. Na Justiça, o STJ já garante IPI e ICMS. Ou seja: é um caso com boa chance judicial, mas sem garantia no processo administrativo.',
      },
      {
        q: 'Quem recebe BPC pode pedir isenção?',
        a: 'Sim. O STJ decidiu em 2025 que receber BPC/LOAS não pode ser motivo para negar a isenção de IPI a pessoa autista.',
      },
    ],
  },
  {
    slug: 'etapas',
    numero: '06',
    titulo: 'A jornada em 7 etapas',
    resumo:
      'Do teste de elegibilidade à nota fiscal com desconto: o caminho completo, com prazos e checklist para imprimir.',
    tempoLeitura: '8 min',
    trust: 'official',
    atualizadoEm: ATUALIZADO,
    keywords: ['etapas', 'passo a passo', 'jornada', 'checklist', 'imprimir', 'nota fiscal', 'prazos'],
    secoes: [
      { id: 'visao-geral', titulo: 'Visão geral do caminho' },
      { id: 'as-7-etapas', titulo: 'As 7 etapas em detalhe' },
      { id: 'prazos', titulo: 'Os prazos que você não pode perder' },
      { id: 'checklist', titulo: 'Checklist para imprimir' },
    ],
    faq: [
      {
        q: 'Por que o ICMS vem depois do IPI?',
        a: 'Porque desde 2021 o Convênio ICMS 38/2012 exige a isenção de IPI deferida antes de conceder o ICMS (a exceção é a Síndrome de Down, fora de SP).',
      },
      {
        q: 'Quanto tempo leva o processo todo?',
        a: 'O IPI costuma sair em cerca de 3 dias úteis; o prazo do ICMS varia por estado. O gargalo real costuma ser juntar laudo e documentos — por isso a organização vem primeiro.',
      },
      {
        q: 'Posso comprar o carro antes das autorizações?',
        a: 'Não. A nota fiscal precisa sair já com o desconto, citando a autorização. Comprar antes é abrir mão da isenção naquela compra.',
      },
    ],
  },
  {
    slug: 'armadilhas',
    numero: '07',
    titulo: 'Armadilhas que travam pedidos',
    resumo:
      'Débitos em aberto, laudo fora do padrão, prazo expirado, carência ignorada e o "despachante que garante".',
    tempoLeitura: '6 min',
    trust: 'official',
    atualizadoEm: ATUALIZADO,
    keywords: ['armadilhas', 'erros', 'indeferido', 'multa', 'débitos', 'despachante', 'golpe', 'prazo expirado'],
    secoes: [
      { id: 'debitos-em-aberto', titulo: 'IPVA e multas em aberto' },
      { id: 'laudo-fora-do-padrao', titulo: 'Laudo fora do padrão' },
      { id: 'prazos-expirados', titulo: 'Prazos expirados' },
      { id: 'carencia-ignorada', titulo: 'Vender antes da carência' },
      { id: 'acima-do-teto', titulo: 'Comprar acima do teto' },
      { id: 'despachante-que-garante', titulo: 'O "despachante que garante"' },
    ],
    faq: [
      {
        q: 'Vendi o carro antes da carência. E agora?',
        a: 'Para o IPI, a devolução é integral (não proporcional) com Selic desde a nota fiscal e exige autorização prévia da Receita — sem ela, há multa de 75% a 150%. Para o ICMS, o recolhimento é proporcional ao tempo restante.',
      },
      {
        q: 'Meu carro teve perda total ou foi roubado. Posso comprar outro com isenção?',
        a: 'A transferência para a seguradora não é "venda" e não gera cobrança, mas a Receita não antecipa uma nova isenção antes do interstício (3 anos no IPI, 4 no ICMS). O STJ já concedeu exceção na Justiça em caso de força maior.',
      },
      {
        q: 'Existe "lista oficial de CIDs" que garantem isenção?',
        a: 'Não. Para deficiência física vale o enquadramento funcional (o impacto na mobilidade/condução), não uma lista de CIDs. Listas que circulam por aí não são oficiais.',
      },
    ],
  },
  {
    slug: 'fontes-oficiais',
    numero: '08',
    titulo: 'Fontes oficiais',
    resumo:
      'Todos os links que importam: Receita Federal (SISEN), SEFAZ de cada UF, Detran e Gov.br — com data de verificação.',
    tempoLeitura: '4 min',
    trust: 'official',
    atualizadoEm: ATUALIZADO,
    keywords: ['fontes', 'links', 'oficiais', 'gov.br', 'receita', 'sefaz', 'detran', 'sites'],
    secoes: [
      { id: 'federal', titulo: 'Governo federal' },
      { id: 'estaduais', titulo: 'SEFAZ e Detran por estado' },
      { id: 'legislacao', titulo: 'Leis e convênios' },
      { id: 'jurisprudencia', titulo: 'Decisões dos tribunais' },
    ],
    faq: [
      {
        q: 'Como vocês verificam as fontes?',
        a: 'Cada regra publicada no IsentaPCD é checada na fonte oficial (lei, convênio ou portal do órgão) e recebe uma data de verificação. O que não encontramos em fonte primária aparece com o badge amarelo ou vermelho — nunca como fato.',
      },
      {
        q: 'Encontrei uma informação diferente no portal do meu estado. O que faço?',
        a: 'A fonte oficial sempre vence. Avise a gente no WhatsApp que corrigimos — e agradecemos publicamente.',
      },
    ],
  },
  {
    slug: 'faq',
    numero: '09',
    titulo: 'FAQ completo',
    resumo:
      'As 20 perguntas que mais recebemos: BPC, MEI, carro usado, segunda isenção, mudança de estado e mais.',
    tempoLeitura: '10 min',
    trust: 'official',
    atualizadoEm: ATUALIZADO,
    keywords: ['faq', 'perguntas', 'dúvidas', 'bpc', 'mei', 'usado', 'segunda isenção', 'mudança de estado'],
    secoes: [
      { id: 'direito-e-elegibilidade', titulo: 'Direito e elegibilidade' },
      { id: 'processo-e-prazos', titulo: 'Processo e prazos' },
      { id: 'dinheiro-e-taxas', titulo: 'Dinheiro e taxas' },
      { id: 'depois-da-compra', titulo: 'Depois da compra' },
    ],
    faq: [],
  },
]

export const CAPITULO_MAP: Record<string, CapituloMeta> = Object.fromEntries(
  CAPITULOS.map((c) => [c.slug, c]),
)

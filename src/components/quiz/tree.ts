import { UF_LIST, type QuizAnswers, type Uf } from '@contracts/constants'

/**
 * Árvore canônica de perguntas da pré-análise (quiz.md Q1).
 * As respostas ficam num Record<StepId, string>; `buildQuizAnswers` converte
 * para o contrato exato de trpc.quiz.submit.
 */

export interface QuizOption {
  value: string
  label: string
  hint?: string
}

export interface QuizStep {
  id: string
  kind: 'single' | 'select' | 'contact'
  question: string
  hint?: string
  /** Popover "Por que perguntamos isso?" (quiz.md: regras de copy). */
  why?: string
  options?: QuizOption[]
  when?: (a: Record<string, string>) => boolean
}

export type QuizRecord = Record<string, string>

export const STEPS: QuizStep[] = [
  {
    id: 'paraQuem',
    kind: 'single',
    question: 'O carro é para você ou para alguém que você cuida?',
    options: [
      { value: 'eu_condutor', label: 'Para mim, eu vou dirigir' },
      { value: 'eu_nao_condutor', label: 'Para mim, mas não dirijo' },
      { value: 'filho_dependente', label: 'Para meu filho(a) ou dependente' },
      { value: 'outro_familiar', label: 'Para outro familiar (sou responsável legal)' },
    ],
  },
  {
    id: 'uf',
    kind: 'select',
    question: 'Em qual estado você mora?',
    hint: 'As regras de ICMS e IPVA mudam de estado para estado.',
  },
  {
    id: 'disabilityType',
    kind: 'single',
    question: 'Qual a deficiência?',
    options: [
      { value: 'fisica', label: 'Física' },
      { value: 'visual', label: 'Visual' },
      { value: 'auditiva', label: 'Auditiva' },
      { value: 'intelectual', label: 'Intelectual' },
      { value: 'tea', label: 'Autismo (TEA)' },
      { value: 'multipla', label: 'Múltipla' },
      { value: 'outra', label: 'Outra / não sei' },
    ],
  },
  {
    id: 'teaSupportLevel',
    kind: 'single',
    question: 'Qual o nível de suporte no laudo?',
    hint: 'Está escrito no laudo médico. Se não souber, tudo bem — a gente orienta.',
    options: [
      { value: '1', label: 'Nível 1 — precisa de algum apoio' },
      { value: '2', label: 'Nível 2 — precisa de apoio substancial' },
      { value: '3', label: 'Nível 3 — precisa de apoio muito substancial' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
    when: (a) => a.disabilityType === 'tea',
  },
  {
    id: 'visaoMonocular',
    kind: 'single',
    question: 'A deficiência visual é em um dos olhos (visão monocular)?',
    options: [
      { value: 'sim', label: 'Sim, visão monocular' },
      { value: 'nao', label: 'Não / nos dois olhos' },
    ],
    when: (a) => a.disabilityType === 'visual',
  },
  {
    id: 'cnhRestriction',
    kind: 'single',
    question: 'Sua CNH tem observação de restrição ou adaptação?',
    options: [
      { value: 'sim', label: 'Sim' },
      { value: 'nao', label: 'Não' },
      { value: 'sem_cnh_especial', label: 'Ainda não tenho CNH especial' },
    ],
    when: (a) => a.paraQuem === 'eu_condutor',
  },
  {
    id: 'quemDirige',
    kind: 'single',
    question: 'Quem vai dirigir o carro?',
    options: [
      { value: 'eu_familiar', label: 'Eu (familiar / responsável)' },
      { value: 'outra_pessoa', label: 'Outra pessoa autorizada' },
      { value: 'mais_de_uma', label: 'Mais de uma pessoa' },
    ],
    when: (a) => a.paraQuem !== undefined && a.paraQuem !== 'eu_condutor',
  },
  {
    id: 'laudoStatus',
    kind: 'single',
    question: 'Você (ou a pessoa) tem laudo médico com CID?',
    options: [
      { value: 'recente', label: 'Sim, recente (menos de 1 ano)' },
      { value: 'antigo', label: 'Sim, antigo' },
      { value: 'nenhum', label: 'Não tenho' },
    ],
  },
  {
    id: 'carroExistente',
    kind: 'single',
    question: 'Já existe algum carro no nome da pessoa com deficiência?',
    options: [
      { value: 'nenhum', label: 'Não' },
      { value: 'com_isencao', label: 'Sim, comprado com isenção' },
      { value: 'sem_isencao', label: 'Sim, sem isenção' },
    ],
  },
  {
    id: 'tempoIsencao',
    kind: 'single',
    question: 'Faz quanto tempo que esse carro foi comprado com isenção?',
    hint: 'Existem prazos de carência entre uma isenção e outra.',
    options: [
      { value: 'menos2', label: 'Menos de 2 anos' },
      { value: 'de2a4', label: 'De 2 a 4 anos' },
      { value: 'mais4', label: 'Mais de 4 anos' },
    ],
    when: (a) => a.carroExistente === 'com_isencao',
  },
  {
    id: 'debitos',
    kind: 'single',
    question: 'A pessoa com deficiência tem débitos?',
    hint: 'IPVA ou multas em aberto no CPF ou no carro atual.',
    why: 'IPVA e multas em aberto travam o pedido na maioria dos estados — a gente já inclui a solução no seu mapa.',
    options: [
      { value: 'nao', label: 'Não' },
      { value: 'sim', label: 'Sim' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
  },
  {
    id: 'cnhJuris',
    kind: 'single',
    question:
      'Sabia que em 2025 a Justiça decidiu que restrição na CNH não pode ser exigida para o IPI? Quer entender como fica seu caso?',
    options: [
      { value: 'quero_entender', label: 'Quero entender', hint: 'Explicamos no seu mapa, com a decisão.' },
      { value: 'seguir', label: 'Prefiro seguir assim' },
    ],
    when: (a) =>
      a.paraQuem === 'eu_condutor' &&
      a.disabilityType === 'fisica' &&
      a.cnhRestriction !== undefined &&
      a.cnhRestriction !== 'sim',
  },
  {
    id: 'faixaPreco',
    kind: 'single',
    question: 'Faixa de preço do carro que você pensa em comprar?',
    options: [
      { value: 'ate70', label: 'Até R$ 70 mil' },
      { value: '70a120', label: 'De R$ 70 a 120 mil' },
      { value: '120a200', label: 'De R$ 120 a 200 mil' },
      { value: 'nao_sei', label: 'Ainda não sei' },
    ],
  },
  {
    id: 'quandoComprar',
    kind: 'single',
    question: 'Quando pretende comprar?',
    options: [
      { value: '3meses', label: 'Nos próximos 3 meses' },
      { value: '3a6meses', label: 'De 3 a 6 meses' },
      { value: 'pesquisando', label: 'Só pesquisando' },
    ],
  },
  {
    id: 'contato',
    kind: 'contact',
    question: 'Para onde enviamos seu resultado completo?',
  },
]

/** Passos visíveis dadas as respostas atuais (ordem preservada). */
export function visibleSteps(answers: QuizRecord): QuizStep[] {
  return STEPS.filter((s) => !s.when || s.when(answers))
}

/** Converte o Record para o contrato exato de trpc.quiz.submit (QuizAnswers). */
export function buildQuizAnswers(a: QuizRecord): QuizAnswers | null {
  const base: QuizAnswers = {
    paraQuem: a.paraQuem as QuizAnswers['paraQuem'],
    uf: a.uf as Uf,
    disabilityType: a.disabilityType as QuizAnswers['disabilityType'],
    laudoStatus: a.laudoStatus as QuizAnswers['laudoStatus'],
    carroExistente: a.carroExistente as QuizAnswers['carroExistente'],
    debitos: a.debitos as QuizAnswers['debitos'],
    faixaPreco: a.faixaPreco as QuizAnswers['faixaPreco'],
  }
  if (!base.paraQuem || !base.uf || !base.disabilityType || !base.laudoStatus || !base.carroExistente || !base.debitos || !base.faixaPreco) {
    return null
  }
  if (a.teaSupportLevel) {
    base.teaSupportLevel =
      a.teaSupportLevel === 'nao_sei'
        ? 'nao_sei'
        : (Number(a.teaSupportLevel) as 1 | 2 | 3)
  }
  if (a.visaoMonocular) base.visaoMonocular = a.visaoMonocular === 'sim'
  if (a.cnhRestriction) base.cnhRestriction = a.cnhRestriction as QuizAnswers['cnhRestriction']
  if (a.quemDirige) base.quemDirige = a.quemDirige as QuizAnswers['quemDirige']
  if (a.tempoIsencao) base.tempoIsencao = a.tempoIsencao as QuizAnswers['tempoIsencao']
  if (a.quandoComprar) base.quandoComprar = a.quandoComprar as QuizAnswers['quandoComprar']
  return base
}

/** Preço representativo por faixa (Q12) para a economia estimada do resultado. */
export const BAND_PRICE: Record<string, number | null> = {
  ate70: 65_000,
  '70a120': 95_000,
  '120a200': 160_000,
  nao_sei: null,
}

export const UF_OPTIONS = UF_LIST

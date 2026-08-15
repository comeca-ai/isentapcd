/** Constantes globais do produto IsentaPCD. */

export const WHATSAPP_NUMBER = '5511999999999'
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Olá! Quero entender se tenho direito às isenções de impostos no carro 0 km.',
)}`

export const PRECO_ACOMPANHAMENTO = 497

/** Data-limite do regime tributário vigente (Reforma Tributária muda as regras em 2027). */
export const REGIME_DEADLINE = new Date('2026-12-31T23:59:59-03:00')

export const LEGAL_DISCLAIMER =
  'O IsentaPCD é uma plataforma privada de orientação. Não somos um órgão governamental e não temos vínculo com a Receita Federal, Secretarias da Fazenda ou Detran. Quem analisa e defere (ou indefere) o pedido de isenção é sempre o órgão público competente. Nunca pedimos sua senha do Gov.br.'

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

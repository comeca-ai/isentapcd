import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Glossário inline (design.md §9.7): termo técnico com sublinhado tracejado
 * que abre um popover com a definição em linguagem simples.
 * Focável por teclado, fecha com Escape ou clique fora.
 */

const DEFINICOES: Record<string, string> = {
  deferido:
    'Quando o órgão público analisa seu pedido e diz "sim". O contrário é "indeferido" (negado).',
  indeferido:
    'Quando o órgão público nega o pedido. Você pode complementar documentos ou recorrer — na Receita Federal, em até 10 dias.',
  carência:
    'Prazo mínimo que você precisa esperar antes de vender o carro ou pedir outra isenção sem devolver imposto.',
  interstício:
    'O intervalo entre uma isenção e a próxima: 3 anos para o IPI e 4 anos para o ICMS.',
  'não condutor':
    'Pessoa com deficiência que não dirige. Ela pode ter o carro no nome dela e indicar condutores autorizados para dirigir.',
  'representante legal':
    'Pai, mãe, tutor ou curador que faz o pedido em nome da pessoa com deficiência (inclusive menor de 18 anos).',
  sisen:
    'Sistema de Gestão de Benefícios Fiscais — o site gratuito da Receita Federal onde se pede a isenção de IPI, com a sua conta Gov.br.',
  laudo:
    'Documento assinado por profissional de saúde que descreve a deficiência e o impacto dela na condução ou na mobilidade. Sem essa conclusão funcional, o pedido costuma travar.',
  perícia:
    'Avaliação presencial feita por junta médica ou clínica credenciada pelo Detran do seu estado para confirmar a deficiência.',
  teto:
    'Valor máximo do carro para a isenção valer. Cada imposto (e cada estado) tem o seu.',
  'carta de isenção':
    'Nome popular da "Autorização para compra de veículo com isenção de IPI/IOF", emitida pela Receita Federal e válida por 270 dias.',
  darf:
    'Guia de pagamento de imposto federal. No pedido de isenção você não paga DARF nenhum — o serviço é gratuito.',
  tea: 'Transtorno do Espectro Autista. Para a isenção, o laudo precisa informar o CID (F84.0 ou F84.1).',
  'valor venal':
    'O valor que o estado atribui ao veículo para calcular impostos — pode ser diferente do preço da nota fiscal.',
}

interface GlossarioProps {
  /** Chave da definição (minúscula). Se omitida, usa o texto dos filhos. */
  termo?: keyof typeof DEFINICOES | string
  children?: ReactNode
}

export default function Glossario({ termo, children }: GlossarioProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const label = children ?? termo
  const key = (termo ?? (typeof children === 'string' ? children : '')).toLowerCase()
  const definicao = DEFINICOES[key]

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!definicao) return <>{label}</>

  return (
    <span ref={rootRef} className="relative inline">
      <button
        type="button"
        role="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline rounded-sm text-accent underline decoration-dotted decoration-1 underline-offset-4 transition-colors hover:text-accent-hover"
      >
        {label}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-2 block w-72 max-w-[80vw] -translate-x-1/2 rounded-input border border-line bg-surface p-3 text-left font-sans text-small not-italic tracking-normal text-txt shadow-card-light"
        >
          <span className="mb-1 block font-mono text-xs uppercase tracking-wider text-txt-2">
            O que significa
          </span>
          {definicao}
        </span>
      )}
    </span>
  )
}

/** Lista de termos do glossário (para a busca do hub). */
export const GLOSSARIO_TERMOS = Object.keys(DEFINICOES)

import type { Confidence } from '@contracts/constants'
import type { TrustLevel } from '@/components/TrustBadge'

/** Mapeia a confiança do contrato (check_org) para o nível do TrustBadge (check). */
export function toTrustLevel(c: Confidence): TrustLevel {
  return c === 'check_org' ? 'check' : c
}

/** Filtro de cor determinístico por slug (cores variáveis via hue-rotate, simulador.md SM2). */
export function hueForSlug(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 360
  return h
}

/** Máscara (00) 00000-0000 — aceita 10 ou 11 dígitos. */
export function maskWhatsapp(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Valida WhatsApp e devolve mensagem de erro descritiva (design.md §9.8) ou null. */
export function whatsappError(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return 'Informe seu WhatsApp — é por ele que enviamos o mapa.'
  if (digits.length < 10) return `WhatsApp incompleto — faltam ${10 - digits.length} dígitos (DDD + número).`
  if (digits.length > 11) return 'WhatsApp longo demais — use DDD + número, ex.: (11) 98765-4321.'
  return null
}

/** Contato do lead persistido em localStorage (pré-preenche modais futuros). */
export interface StoredContact {
  name: string
  whatsapp: string
  referredBy?: string
}

const CONTACT_KEY = 'isentapcd:contato'

export function loadContact(): StoredContact | null {
  try {
    const raw = localStorage.getItem(CONTACT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredContact
    if (typeof parsed.name !== 'string' || typeof parsed.whatsapp !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function saveContact(c: StoredContact): void {
  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(c))
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}

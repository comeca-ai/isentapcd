import type { ComponentType } from 'react'
import IpiContent from '@/components/guia/capitulos/IpiContent'
import IcmsContent from '@/components/guia/capitulos/IcmsContent'
import IpvaContent from '@/components/guia/capitulos/IpvaContent'
import RodizioContent from '@/components/guia/capitulos/RodizioContent'
import RequisitosContent from '@/components/guia/capitulos/RequisitosContent'
import EtapasContent from '@/components/guia/capitulos/EtapasContent'
import ArmadilhasContent from '@/components/guia/capitulos/ArmadilhasContent'
import FontesContent from '@/components/guia/capitulos/FontesContent'
import FaqCapituloContent from '@/components/guia/capitulos/FaqCapituloContent'

export const CAPITULO_CONTENT: Record<string, ComponentType> = {
  ipi: IpiContent,
  icms: IcmsContent,
  ipva: IpvaContent,
  rodizio: RodizioContent,
  requisitos: RequisitosContent,
  etapas: EtapasContent,
  armadilhas: ArmadilhasContent,
  'fontes-oficiais': FontesContent,
  faq: FaqCapituloContent,
}

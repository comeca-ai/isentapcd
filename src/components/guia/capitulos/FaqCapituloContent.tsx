import Secao from '@/components/guia/Secao'
import FaqAccordion, { type FaqItem } from '@/components/guia/FaqAccordion'

const GRUPOS: { id: string; titulo: string; items: FaqItem[] }[] = [
  {
    id: 'direito-e-elegibilidade',
    titulo: 'Direito e elegibilidade',
    items: [
      {
        q: 'Tenho síndrome de Down — preciso do IPI antes de pedir o ICMS?',
        a: 'Não: a exceção do Convênio ICMS 161/2021 permite pedir o ICMS sem o IPI deferido antes. Atenção: SP não aplica essa exceção e exige o IPI de todos.',
      },
      {
        q: 'Sou não condutor / compro para meu filho autista. Posso?',
        a: 'Sim, via representante legal, com laudo de médico e psicólogo (serviço público ou conveniado ao SUS) e indicação de até 3 condutores autorizados na mesma localidade. O veículo fica no nome da pessoa com deficiência.',
      },
      {
        q: 'Quem recebe BPC pode pedir a isenção?',
        a: 'Sim. O STJ decidiu (REsp 1.993.981/PE, 2025) que é ilegal negar isenção de IPI a pessoa autista porque recebe BPC/LOAS.',
      },
      {
        q: 'Tenho visão monocular. Tenho direito?',
        a: 'No administrativo, a Receita nega. Na Justiça, o STJ já garante IPI e ICMS. Tratamos esse caso com transparência: a chance real é pela via judicial.',
      },
      {
        q: 'Autista nível 1 / deficiência leve tem direito?',
        a: 'Em 2026, o IPI federal exige deficiência mental severa ou profunda (TEA entra com CID F84.0/F84.1) e SP exige grau moderado ou grave no IPVA. O STF derrubou o filtro de grau apenas no regime novo (2027+). Seu caso pode ser judicializável já em 2026 — avaliamos com você antes.',
      },
      {
        q: 'A isenção vale para carro usado?',
        a: 'IPI e ICMS: não, só 0 km. IPVA: vários estados aceitam usado dentro do teto de valor venal (RO, AC, AP; em SP, com pedido antes de 1º de janeiro do exercício).',
      },
      {
        q: 'Quantos condutores autorizados posso indicar?',
        a: 'No ICMS, até 3, residentes na mesma localidade. Se a deficiência for física e houver terceiro condutor, o estado pode exigir laudo de incapacidade total para dirigir.',
      },
    ],
  },
  {
    id: 'processo-e-prazos',
    titulo: 'Processo e prazos',
    items: [
      {
        q: 'Vocês pedem minha senha do Gov.br?',
        a: 'Nunca. Você acessa o SISEN e os portais estaduais com a sua própria conta. O IsentaPCD orienta, organiza documentos e prazos — não acessa sua conta nem protocola em seu lugar.',
      },
      {
        q: 'Quem defere (aprova) o benefício?',
        a: 'Exclusivamente o órgão público: a Receita Federal para IPI/IOF e a Secretaria da Fazenda do seu estado para ICMS/IPVA. Nenhuma plataforma ou despachante decide pelo órgão.',
      },
      {
        q: 'O que é o SISEN?',
        a: 'O Sistema de Gestão de Benefícios Fiscais, site gratuito da Receita Federal onde o pedido de isenção de IPI é feito e acompanhado. O documento emitido se chama "Autorização para compra de veículo com isenção de IPI/IOF" — a tal "carta de isenção".',
      },
      {
        q: 'O laudo do meu médico particular serve?',
        a: 'No administrativo, não: precisa ser de serviço público de saúde, conveniado ao SUS, Detran/clínica credenciada ou serviço social autônomo (como APAE). Na Justiça, laudo particular já foi aceito como prova.',
      },
      {
        q: 'Preciso de "CNH especial"?',
        a: 'Não existe CNH especial — existe a CNH com observações/restrições, definida por junta de peritos do Detran. Condutor com deficiência física passa por essa perícia; não condutor não precisa. Para o IPI, o STJ decidiu que restrição na CNH não pode ser exigida.',
      },
      {
        q: 'O que muda em 01/01/2027?',
        a: 'O regime atual expira em 31/12/2026. A partir de 2027 vale a alíquota zero de IBS/CBS (veículo até R$ 200 mil, benefício sobre operações de até R$ 100 mil, 1 carro a cada 3 anos) — sem filtro de grau, por decisão do STF. Quem protocola em 2026 trava o regime vigente.',
      },
    ],
  },
  {
    id: 'dinheiro-e-taxas',
    titulo: 'Dinheiro e taxas',
    items: [
      {
        q: 'Qual o teto do carro em 2026?',
        a: 'IPI: R$ 200 mil. ICMS: isenção total até R$ 70 mil e parcial até R$ 120 mil. IPVA: varia por estado (SP 70/120 mil; SC R$ 200 mil; RS cerca de R$ 144 mil; RJ R$ 55 mil; MS é só redução de 60%).',
      },
      {
        q: 'As guias/taxas precisam estar pagas antes do envio?',
        a: 'Depende do estado. Federal (SISEN): gratuito, sem guia. SP: sem guia antes do protocolo (só a perícia IMESC, R$ 268,94 em 2026). SC: sim, o DARE do TTD é condição de análise. RJ: sim, TSE de R$ 279,72 via DARJ. MS: DAEMS. Nas demais UFs, nenhuma taxa localizada — mas IPVA e multas em aberto bloqueiam o pedido em todas.',
      },
      {
        q: 'Quanto custa o processo todo?',
        a: 'Federal: R$ 0. Estadual: R$ 0 na maioria das UFs — exceções: RJ (TSE R$ 279,72), SC (DARE do TTD, valor a confirmar), MS (DAEMS), SP (perícia IMESC R$ 268,94). Adaptações veiculares, se necessárias, são um custo à parte, em oficina homologada.',
      },
      {
        q: 'O desconto vem na nota fiscal?',
        a: 'Sim. O imposto isento aparece destacado na nota como redução do preço ao consumidor, com a citação da autorização. Se a concessionária "prometer desconto depois", desconfie: sem autorização em mãos antes da compra, não há desconto retroativo.',
      },
    ],
  },
  {
    id: 'depois-da-compra',
    titulo: 'Depois da compra',
    items: [
      {
        q: 'Posso vender o carro antes da carência?',
        a: 'IPI: antes de 2 anos, devolução integral + Selic, com autorização prévia da Receita. ICMS/IPVA: antes de 4 anos, recolhimento proporcional. Vender para outra pessoa com direito pode manter a isenção.',
      },
      {
        q: 'Meu carro teve perda total ou foi furtado. Posso comprar outro isento?',
        a: 'A transferência à seguradora não é "venda" e não gera cobrança, mas administrativamente a nova isenção só vem depois do interstício (3 anos no IPI, 4 no ICMS). O STJ já concedeu exceção na Justiça em caso de força maior — é caso para avaliação jurídica.',
      },
      {
        q: 'Posso ter uma segunda isenção?',
        a: 'Sim, respeitados os intervalos: 3 anos entre isenções de IPI e 4 anos no ICMS. O IOF é uma única vez na vida.',
      },
      {
        q: 'Mudei de estado. E agora?',
        a: 'ICMS e IPVA são estaduais: valem as regras do seu novo estado (teto, renovação, prazos). Antes de se mudar, confirme com a SEFAZ de destino como o benefício é tratado — a gente ajuda a mapear.',
      },
    ],
  },
]

/** Conteúdo do capítulo FAQ completo (dossiê §9 — respostas canônicas). */
export default function FaqCapituloContent() {
  return (
    <>
      {GRUPOS.map((grupo, idx) => (
        <Secao key={grupo.id} id={grupo.id} numero={String(idx + 1)} titulo={grupo.titulo}>
          <FaqAccordion items={grupo.items} idPrefix={`faq-cap-${grupo.id}`} />
        </Secao>
      ))}
    </>
  )
}

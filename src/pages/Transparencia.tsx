import { useEffect } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, MessageCircle, X } from 'lucide-react'
import TrustBadge from '@/components/TrustBadge'
import { PRECO_ACOMPANHAMENTO, WHATSAPP_URL } from '@/lib/constants'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const GRATIS = [
  'Guia completo das isenções (9 capítulos, com fontes oficiais)',
  'Mapa de regras dos 27 estados, com nível de confiança por dado',
  'Simulador de economia no seu carro',
  'Pré-análise de elegibilidade em 2 minutos',
  'Primeira conversa no WhatsApp, com gente de verdade',
]

const PAGO = [
  'Revisão humana dos seus documentos antes de cada protocolo (laudo, identidade, comprovantes)',
  'Checklist do seu caso por órgão: Receita, SEFAZ e Detran do seu estado',
  'Alertas de prazo: validade das autorizações, carências e renovações',
  'Suporte no WhatsApp durante todo o processo — resposta em até 1 dia útil',
  'Atualização do seu plano se a regra do seu estado mudar no meio do caminho',
]

const NAO_FAZEMOS = [
  {
    titulo: 'Não somos órgão público',
    texto:
      'Somos uma plataforma privada de orientação, sem vínculo com Receita Federal, SEFAZ ou Detran.',
  },
  {
    titulo: 'Não garantimos deferimento',
    texto:
      'Quem decide é sempre a Receita Federal ou a SEFAZ do seu estado. Prometer deferimento é golpe — e a gente avisa.',
  },
  {
    titulo: 'Não pedimos sua senha do Gov.br',
    texto:
      'Você acessa o SISEN e os portais com a sua própria conta. Nós não acessamos nem protocolamos em seu lugar.',
  },
  {
    titulo: 'Não cobramos taxa de órgão em nosso nome',
    texto:
      'Taxas estaduais, quando existem (ex.: perícia em SP, TSE no RJ), são pagas por você diretamente ao órgão ou à clínica.',
  },
]

const BREAKDOWN = [
  { label: 'Revisão humana de documentos', pct: 40 },
  { label: 'Plataforma e alertas de prazo', pct: 25 },
  { label: 'Suporte humano no WhatsApp', pct: 20 },
  { label: 'Manutenção do conteúdo por UF (27 estados)', pct: 15 },
]

export default function Transparencia() {
  const reduced = useReducedMotion()

  useEffect(() => {
    document.title = 'Transparência: o que é grátis e o que custa R$ 497 — IsentaPCD'
    return () => {
      document.title = 'IsentaPCD'
    }
  }, [])

  return (
    <>
      <section className="mx-auto max-w-[1080px] px-6 pb-16 pt-24 lg:px-10">
        <motion.div
          initial={reduced ? false : { y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="font-mono text-mono font-medium uppercase tracking-wider text-accent">
            Transparência
          </p>
          <h1 className="mt-4 max-w-[20ch] text-h1 font-medium">
            O que é grátis, o que custa R$ 497 — e por quê.
          </h1>
          <p className="mt-6 max-w-prose68 text-lead text-txt-2">
            Esta página existe porque confiança não se pede: se mostra. Aqui está tudo aberto —
            preço, limites e de onde sai cada informação.
          </p>
        </motion.div>
      </section>

      {/* Grátis vs pago */}
      <section aria-labelledby="gratis-pago-title" className="mx-auto max-w-[1080px] px-6 py-16 lg:px-10">
        <h2 id="gratis-pago-title" className="text-h2 font-medium">
          Grátis para sempre vs. acompanhamento completo
        </h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-card border border-line bg-surface p-6 lg:p-8">
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-success">
              Grátis para sempre
            </p>
            <p className="mt-1 font-display text-h3 font-medium">R$ 0</p>
            <ul className="mt-6 space-y-3">
              {GRATIS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-body text-txt-2">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-accent/40 bg-surface p-6 lg:p-8">
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
              Acompanhamento completo
            </p>
            <p className="mt-1 font-display text-h3 font-medium">
              R$ {PRECO_ACOMPANHAMENTO}{' '}
              <span className="font-sans text-small font-normal text-txt-2">
                pagamento único, por processo
              </span>
            </p>
            <ul className="mt-6 space-y-3">
              {PAGO.map((item) => (
                <li key={item} className="flex items-start gap-3 text-body text-txt-2">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* O que NÃO fazemos */}
      <section aria-labelledby="nao-fazemos-title" className="bg-bg-alt">
        <div className="mx-auto max-w-[1080px] px-6 py-24 lg:px-10">
          <h2 id="nao-fazemos-title" className="text-h2 font-medium">
            O que nós NÃO fazemos
          </h2>
          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="mt-10 grid gap-6 sm:grid-cols-2"
          >
            {NAO_FAZEMOS.map((item) => (
              <motion.li
                key={item.titulo}
                variants={{
                  hidden: { y: 16, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } },
                }}
                className="flex gap-4 rounded-card border border-danger/40 bg-surface p-6"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-danger/50 text-danger">
                  <X className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-h3 font-medium">{item.titulo}</h3>
                  <p className="mt-2 text-body text-txt-2">{item.texto}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* Metodologia de dados */}
      <section aria-labelledby="metodologia-title" className="mx-auto max-w-[1080px] px-6 py-24 lg:px-10">
        <h2 id="metodologia-title" className="text-h2 font-medium">
          De onde vêm nossas informações
        </h2>
        <p className="mt-4 max-w-prose68 text-body text-txt-2">
          Cada regra publicada é verificada na fonte oficial (lei, convênio ou portal do órgão) e
          recebe uma data de verificação. Quando o dado não está cravado em fonte primária, ele
          aparece marcado — nunca como fato:
        </p>
        <ul className="mt-8 space-y-4">
          <li className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4">
            <TrustBadge level="official" />
            <span className="text-body text-txt-2">
              Checado diretamente na lei ou no site do órgão. Ex.: o processo do IPI no SISEN.
            </span>
          </li>
          <li className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4">
            <TrustBadge level="secondary" />
            <span className="text-body text-txt-2">
              Fonte confiável, mas não oficial. Ex.: o valor da TSE do RJ, sujeito a atualização
              anual.
            </span>
          </li>
          <li className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4">
            <TrustBadge level="check" />
            <span className="text-body text-txt-2">
              Lacuna oficial. Ex.: a regra de IPVA de alguns estados — nesses casos dizemos
              "confirme com a SEFAZ", e não afirmamos nada.
            </span>
          </li>
        </ul>
        <p className="mt-8 max-w-prose68 text-body text-txt-2">
          Errou? Acha que algo mudou?{' '}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-4"
          >
            Avisa no WhatsApp
          </a>{' '}
          que corrigimos e agradecemos publicamente.
        </p>
      </section>

      {/* Breakdown do preço */}
      <section aria-labelledby="preco-title" className="bg-bg-alt">
        <div className="mx-auto max-w-[1080px] px-6 py-24 lg:px-10">
          <h2 id="preco-title" className="text-h2 font-medium">
            Por que R$ 497?
          </h2>
          <p className="mt-4 max-w-prose68 text-body text-txt-2">
            Breakdown honesto de para onde vai o valor do acompanhamento:
          </p>
          <div className="mt-10 space-y-6">
            {BREAKDOWN.map((b, i) => (
              <div key={b.label}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-body text-txt">{b.label}</p>
                  <p className="font-mono text-mono text-accent">
                    {b.pct}% · ≈ R$ {Math.round((PRECO_ACOMPANHAMENTO * b.pct) / 100)}
                  </p>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink-700">
                  <motion.div
                    initial={reduced ? false : { scaleX: 0 }}
                    whileInView={{ scaleX: b.pct / 100 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.08, ease: EASE }}
                    style={{ transformOrigin: 'left' }}
                    className="h-full w-full rounded-full bg-accent"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-prose68 text-small text-txt-2">
            E se você desistir em até 7 dias, devolvemos integralmente (art. 49 do Código de Defesa
            do Consumidor) — sem perguntas difíceis.
          </p>
        </div>
      </section>

      {/* CTA duplo */}
      <section className="mx-auto max-w-[1080px] px-6 py-24 lg:px-10">
        <div className="rounded-card border border-line bg-surface p-8 text-center lg:p-12">
          <h2 className="mx-auto max-w-[24ch] text-h2 font-medium">
            Comece pelo que é grátis. Sempre.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/pre-analise"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-accent px-6 font-bold text-on-accent transition-all hover:bg-accent-hover active:scale-[0.98]"
            >
              Fazer a pré-análise grátis
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-whatsapp-dark px-6 font-medium text-white transition-colors hover:brightness-110"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Tirar dúvida no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

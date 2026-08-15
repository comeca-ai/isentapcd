import { useEffect } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Hourglass,
  Map,
} from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

interface RoadmapSection {
  key: string
  title: string
  note: string
  Icon: typeof CheckCircle2
  cls: string
  items: { title: string; text: string }[]
}

const SECTIONS: RoadmapSection[] = [
  {
    key: 'feito',
    title: 'Feito agora',
    note: 'Já está no ar, funcionando na sua conta.',
    Icon: CheckCircle2,
    cls: 'border-success/40 bg-success/5 text-success',
    items: [
      {
        title: 'OCR com Mistral + avisos por e-mail',
        text: 'Todo documento enviado é lido automaticamente e checado (CID no laudo, CPF, nome, guia paga). Você recebe e-mail a cada envio: recebido, verificado ou o que ajustar.',
      },
      {
        title: 'Trilha guiada de documentos',
        text: 'Sequência numerada na ordem lógica do processo — identidade, laudo, CNH, guias, IPI, ICMS, NF-e e pós-compra — com card "Seu próximo passo" e progresso "X de N".',
      },
    ],
  },
  {
    key: 'andamento',
    title: 'Em andamento',
    note: 'Estamos construindo agora.',
    Icon: Hourglass,
    cls: 'border-warn/40 bg-warn/5 text-warn',
    items: [
      {
        title: 'Validação automática de guias pagas',
        text: 'Conferir valor, vencimento e beneficiário das guias (TSE do RJ, IMESC de SP…) assim que o comprovante chega.',
      },
    ],
  },
  {
    key: 'proximo',
    title: 'Próximo',
    note: 'Entra logo depois da POC.',
    Icon: CircleDashed,
    cls: 'border-accent/40 bg-accent/5 text-accent',
    items: [
      {
        title: 'Pré-preenchimento do pedido no SISEN',
        text: 'O requerimento de IPI quase pronto, com seus dados e os textos revisados pelo time.',
      },
      {
        title: 'Integração com portais estaduais de ICMS',
        text: 'Acompanhar o protocolo do pedido de ICMS direto no portal da Sefaz da sua UF.',
      },
      {
        title: 'Lembretes por WhatsApp',
        text: 'Prazos de autorização (270/180 dias), carências (2/4 anos) e próximos passos, direto no seu WhatsApp.',
      },
    ],
  },
  {
    key: 'depois',
    title: 'Depois',
    note: 'No horizonte, sem data prometida.',
    Icon: Clock3,
    cls: 'border-line bg-surface text-txt-2',
    items: [
      {
        title: 'Assinatura digital de procurações',
        text: 'Quando houver procuração no processo, assinar sem impressão nem cartório.',
      },
      {
        title: 'Pagamento online',
        text: 'Quando sair da POC, a cobrança do acompanhamento completo acontece direto na plataforma. Hoje, durante a prova de conceito, é tudo grátis.',
      },
      {
        title: 'App mobile',
        text: 'A trilha inteira no bolso, com captura de documentos pela câmera.',
      },
    ],
  },
]

/** /roadmap — página pública (dark, Layout) com o que já existe e o que vem. */
export default function Roadmap() {
  const reduced = useReducedMotion()

  useEffect(() => {
    document.title = 'Roadmap: o que já existe e o que vem — IsentaPCD'
    return () => {
      document.title = 'IsentaPCD'
    }
  }, [])

  return (
    <>
      <section className="mx-auto max-w-[1080px] px-6 pb-8 pt-24 lg:px-10">
        <motion.div
          initial={reduced ? false : { y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="flex items-center gap-2 font-mono text-mono font-medium uppercase tracking-wider text-accent">
            <Map className="h-4 w-4" aria-hidden="true" />
            Roadmap
          </p>
          <h1 className="mt-4 max-w-[24ch] text-h1 font-medium">
            O que já existe, o que está saindo e o que vem depois.
          </h1>
          <p className="mt-6 max-w-prose68 text-lead text-txt-2">
            Transparência também é mostrar para onde estamos indo. Nada aqui é promessa vazia:
            o que está em "feito agora" você já usa hoje.
          </p>
        </motion.div>
      </section>

      <section aria-label="Fases do roadmap" className="mx-auto max-w-[1080px] px-6 pb-24 lg:px-10">
        <div className="flex flex-col gap-12">
          {SECTIONS.map(({ key, title, note, Icon, cls, items }, sIdx) => (
            <motion.section
              key={key}
              aria-labelledby={`roadmap-${key}`}
              initial={reduced ? false : { y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: EASE, delay: reduced ? 0 : sIdx * 0.05 }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-small font-bold ${cls}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {title}
                </span>
                <p className="text-small text-txt-2">{note}</p>
              </div>
              <h2 id={`roadmap-${key}`} className="sr-only">
                {title}
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-card border border-line bg-surface p-6"
                  >
                    <h3 className="text-h3 font-medium">{item.title}</h3>
                    <p className="mt-2 text-body text-txt-2">{item.text}</p>
                  </li>
                ))}
              </ul>
            </motion.section>
          ))}
        </div>

        <div className="mt-16 rounded-card border border-line bg-surface p-8 text-center lg:p-12">
          <h2 className="mx-auto max-w-[24ch] text-h2 font-medium">
            Quer testar o que já existe?
          </h2>
          <p className="mx-auto mt-3 max-w-prose68 text-body text-txt-2">
            A pré-análise é grátis e leva 2 minutos — e, durante a POC, o acompanhamento completo
            também é grátis.
          </p>
          <Link
            to="/pre-analise"
            className="mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-accent px-7 font-bold text-on-accent transition-all hover:bg-accent-hover hover:shadow-amber-glow active:scale-[0.98]"
          >
            Fazer a pré-análise grátis
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  )
}

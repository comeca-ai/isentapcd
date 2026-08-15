import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { WHATSAPP_URL } from '@/lib/constants'
import { cn } from '@/lib/utils'

const CLAUSULAS = [
  {
    id: 'o-que-e',
    titulo: '1. O que é o IsentaPCD',
    resumo: 'Em resumo: somos uma plataforma de orientação, não um órgão público.',
    corpo: [
      'O IsentaPCD é uma plataforma privada de orientação e gestão documental sobre isenções de impostos (IPI, ICMS, IPVA) para pessoas com deficiência na compra de carro 0 km.',
      'Não temos vínculo com a Receita Federal, Secretarias da Fazenda, Detran ou qualquer órgão público. Nosso trabalho é traduzir regras, organizar seus documentos e te lembrar dos prazos.',
    ],
  },
  {
    id: 'gratis-e-pago',
    titulo: '2. O que é grátis e o que é pago',
    resumo: 'Em resumo: guia, simulador e pré-análise são grátis para sempre; o acompanhamento completo custa R$ 497 (pagamento único).',
    corpo: [
      'São gratuitos: o guia educativo, o simulador de economia, a pré-análise de elegibilidade e a primeira conversa no WhatsApp.',
      'O acompanhamento completo (revisão humana de documentos, checklist por órgão, alertas de prazo e suporte contínuo) custa R$ 497, pagos uma única vez por processo, e só depois de você saber exatamente o que está incluso.',
    ],
  },
  {
    id: 'nao-prometemos',
    titulo: '3. O que não prometemos',
    resumo: 'Em resumo: não garantimos deferimento, prazo ou decisão — isso é sempre do órgão público.',
    corpo: [
      'Quem analisa e defere (ou indefere) qualquer pedido de isenção é exclusivamente o órgão público competente. Não garantimos resultado, prazo de análise ou decisão.',
      'Também não pedimos nem guardamos sua senha do Gov.br. Se alguém fizer isso em nosso nome, não somos nós — fale conosco imediatamente.',
    ],
  },
  {
    id: 'conta-e-dados',
    titulo: '4. Sua conta e seus dados',
    resumo: 'Em resumo: seus dados são seus; usamos só para prestar o serviço, como explica a página de Privacidade.',
    corpo: [
      'Para usar a área logada você cria uma conta com e-mail e senha. Você é responsável por manter suas credenciais em sigilo.',
      'O tratamento dos seus dados (inclusive dados sensíveis de saúde) segue a nossa Política de Privacidade, escrita em linguagem simples, nos termos da LGPD.',
    ],
  },
  {
    id: 'pagamento-e-reembolso',
    titulo: '5. Pagamento e reembolso',
    resumo: 'Em resumo: desistiu em até 7 dias? Devolvemos tudo, como manda o art. 49 do Código de Defesa do Consumidor.',
    corpo: [
      'O pagamento do acompanhamento é único (R$ 497) e libera as etapas de execução na plataforma.',
      'Você pode desistir em até 7 dias corridos após a compra e receber reembolso integral, sem justificativa — é o direito de arrependimento do art. 49 do CDC. Para pedir, basta chamar no WhatsApp ou no e-mail de contato.',
    ],
  },
  {
    id: 'conduta',
    titulo: '6. Conduta',
    resumo: 'Em resumo: use a plataforma de boa fé; documentos falsos encerram o acompanhamento sem reembolso.',
    corpo: [
      'Você se compromete a fornecer informações e documentos verdadeiros. Fraude documental é crime e encerra o acompanhamento imediatamente, sem reembolso.',
      'Tentar acessar a conta de outra pessoa ou explorar falhas da plataforma também viola estes termos.',
    ],
  },
  {
    id: 'mudancas',
    titulo: '7. Mudanças nos termos',
    resumo: 'Em resumo: se algo mudar, avisamos antes e em linguagem simples.',
    corpo: [
      'Podemos atualizar estes termos quando o serviço ou a legislação mudarem. Avisaremos por e-mail e pela plataforma antes de qualquer mudança relevante, sempre com um resumo em linguagem simples do que mudou.',
      'A versão vigente é sempre a publicada nesta página, com a data de atualização.',
    ],
  },
  {
    id: 'contato-termos',
    titulo: '8. Contato',
    resumo: 'Em resumo: dúvidas sobre estes termos? Fale com uma pessoa, não com um robô.',
    corpo: [
      'Dúvidas sobre estes termos podem ser enviadas para contato@isentapcd.com.br ou pelo WhatsApp, em horário comercial (seg a sex, 9h às 18h, horário de Brasília).',
    ],
  },
]

/** Termos de uso em linguagem simples, com sumário âncora sticky (institucional.md §3). */
export default function Termos() {
  const [ativo, setAtivo] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Termos de uso — IsentaPCD'
    return () => {
      document.title = 'IsentaPCD'
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setAtivo(entry.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    CLAUSULAS.forEach((c) => {
      const el = document.getElementById(c.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <section className="mx-auto max-w-[720px] px-6 pb-8 pt-24 lg:px-10">
        <p className="font-mono text-mono font-medium uppercase tracking-wider text-accent">
          Documento legal em linguagem simples
        </p>
        <h1 className="mt-4 text-h1 font-medium">Termos de uso</h1>
        <p className="mt-6 text-lead text-txt-2">
          Atualizado em agosto de 2026. Cada cláusula tem um resumo de uma linha — mas o texto
          completo é o que vale juridicamente.
        </p>
      </section>

      <div className="mx-auto grid max-w-content gap-12 px-6 pb-24 lg:grid-cols-[240px_minmax(0,720px)] lg:px-10">
        <nav aria-label="Sumário dos termos" className="sticky top-24 hidden self-start lg:block">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-txt-2">
            Neste documento
          </p>
          <ul className="mt-4 space-y-1 border-l border-line">
            {CLAUSULAS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  aria-current={ativo === c.id ? 'location' : undefined}
                  className={cn(
                    '-ml-px block border-l-2 py-1.5 pl-4 text-small transition-colors',
                    ativo === c.id
                      ? 'border-accent font-medium text-accent'
                      : 'border-transparent text-txt-2 hover:text-txt',
                  )}
                >
                  {c.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-16">
          {CLAUSULAS.map((c) => (
            <section key={c.id} id={c.id} aria-labelledby={`${c.id}-title`} className="scroll-mt-24">
              <h2 id={`${c.id}-title`} className="text-h2 font-medium">
                {c.titulo}
              </h2>
              <p className="mt-4 rounded-card border border-accent/40 bg-accent/[.08] px-4 py-3 text-small text-txt">
                {c.resumo}
              </p>
              <div className="mt-4 space-y-4 text-body text-txt-2">
                {c.corpo.map((p, i) => (
                  <p key={i}>
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <p className="text-small text-txt-2">
            Veja também a nossa{' '}
            <Link to="/privacidade" className="text-accent underline underline-offset-4">
              Política de Privacidade
            </Link>{' '}
            e a página de{' '}
            <Link to="/transparencia" className="text-accent underline underline-offset-4">
              Transparência
            </Link>
            . Para qualquer dúvida,{' '}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-4"
            >
              fale com a gente no WhatsApp
            </a>
            .
          </p>
        </div>
      </div>
    </>
  )
}

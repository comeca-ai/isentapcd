import { useEffect } from 'react'
import { KeyRound, HeartPulse, Mail, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

const TABELA_DADOS = [
  {
    dado: 'Nome, e-mail, WhatsApp',
    finalidade: 'Criar sua conta, responder contatos e enviar alertas de prazo',
    retencao: 'Enquanto a conta existir',
    compartilhado: 'Com ninguém, salvo obrigação legal',
  },
  {
    dado: 'Estado (UF) e faixa de preço do carro',
    finalidade: 'Simular a economia e aplicar as regras do seu estado',
    retencao: 'Enquanto a conta existir',
    compartilhado: 'Com ninguém, salvo obrigação legal',
  },
  {
    dado: 'Dados de saúde/deficiência (tipo de deficiência, laudo enviado)',
    finalidade: 'Pré-análise de elegibilidade e revisão humana de documentos (no plano pago)',
    retencao: 'Enquanto durar o acompanhamento; apagados se você excluir a conta',
    compartilhado: 'Com ninguém, salvo obrigação legal',
  },
  {
    dado: 'Documentos enviados (PDF/foto)',
    finalidade: 'Revisão humana e organização do checklist por órgão',
    retencao: 'Enquanto durar o acompanhamento; apagados se você excluir a conta',
    compartilhado: 'Com ninguém, salvo obrigação legal',
  },
]

/** Política de Privacidade (LGPD) em linguagem simples (institucional.md §4). */
export default function Privacidade() {
  useEffect(() => {
    document.title = 'Privacidade e LGPD — IsentaPCD'
    return () => {
      document.title = 'IsentaPCD'
    }
  }, [])

  return (
    <div className="mx-auto max-w-[720px] px-6 pb-24 pt-24 lg:px-10">
      <p className="font-mono text-mono font-medium uppercase tracking-wider text-accent">
        LGPD em linguagem simples
      </p>
      <h1 className="mt-4 text-h1 font-medium">Privacidade</h1>
      <p className="mt-6 text-lead text-txt-2">
        Atualizado em agosto de 2026. Aqui você entende o que coletamos, para quê, por quanto tempo
        — e como apagar tudo.
      </p>

      {/* Destaques em cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-card border border-success/50 bg-success/[.07] p-6">
          <KeyRound className="h-7 w-7 text-success" aria-hidden="true" />
          <h2 className="mt-4 text-h3 font-medium">Sua senha do Gov.br nunca passa por nós</h2>
          <p className="mt-2 text-body text-txt-2">
            Você acessa o SISEN e os portais estaduais com a sua própria conta. Nós não pedimos, não
            guardamos e não temos como ver essa senha.
          </p>
        </div>
        <div className="rounded-card border border-line bg-surface p-6">
          <HeartPulse className="h-7 w-7 text-accent" aria-hidden="true" />
          <h2 className="mt-4 text-h3 font-medium">Dados de saúde: por que pedimos</h2>
          <p className="mt-2 text-body text-txt-2">
            Tipo de deficiência e laudo são dados sensíveis. Coletamos com uma única finalidade:
            avaliar sua elegibilidade e revisar seus documentos. Base legal: tutela da saúde e
            execução do serviço que você contratou (LGPD, arts. 7º e 11).
          </p>
        </div>
      </div>

      {/* Tabela de dados */}
      <section aria-labelledby="tabela-title" className="mt-16">
        <h2 id="tabela-title" className="text-h2 font-medium">
          O que coletamos, para quê e por quanto tempo
        </h2>
        <div className="mt-6 overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left text-small">
            <caption className="sr-only">
              Dados coletados pelo IsentaPCD, finalidade, tempo de retenção e compartilhamento
            </caption>
            <thead>
              <tr className="border-b border-line bg-ink-800">
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">Dado</th>
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">Para quê</th>
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">Por quanto tempo</th>
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-txt-2">Compartilhado com</th>
              </tr>
            </thead>
            <tbody>
              {TABELA_DADOS.map((l, i) => (
                <tr key={l.dado} className={`border-b border-line/50 ${i % 2 === 0 ? 'bg-ink-800' : 'bg-ink-900'}`}>
                  <th scope="row" className="px-4 py-3 font-medium text-txt">{l.dado}</th>
                  <td className="px-4 py-3 text-txt-2">{l.finalidade}</td>
                  <td className="px-4 py-3 text-txt-2">{l.retencao}</td>
                  <td className="px-4 py-3 text-txt-2">{l.compartilhado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-body text-txt-2">
          Resposta honesta sobre compartilhamento: <strong>com ninguém</strong>, salvo obrigação
          legal (ordem judicial, por exemplo). Não vendemos dados, não temos anúncios e não fazemos
          perfilamento para publicidade.
        </p>
      </section>

      {/* Seus direitos */}
      <section aria-labelledby="direitos-title" className="mt-16">
        <h2 id="direitos-title" className="text-h2 font-medium">
          Seus direitos (e como exercê-los)
        </h2>
        <ul className="mt-6 space-y-4 text-body text-txt-2">
          <li className="flex gap-3">
            <Trash2 className="mt-1 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
            <span>
              <strong className="text-txt">Excluir tudo:</strong> em{' '}
              <Link to="/app/conta" className="text-accent underline underline-offset-4">
                Minha conta → Excluir minha conta
              </Link>
              , ou pedindo por e-mail. A exclusão apaga seus dados pessoais e documentos.
            </span>
          </li>
          <li className="flex gap-3">
            <Mail className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <span>
              <strong className="text-txt">Acessar, corrigir ou exportar:</strong> escreva para o
              nosso encarregado de dados (DPO) em{' '}
              <a
                href="mailto:privacidade@isentapcd.com.br"
                className="text-accent underline underline-offset-4"
              >
                privacidade@isentapcd.com.br
              </a>
              . Respondemos em até 15 dias, como manda a LGPD.
            </span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="seguranca-title" className="mt-16">
        <h2 id="seguranca-title" className="text-h2 font-medium">
          Segurança
        </h2>
        <p className="mt-4 text-body text-txt-2">
          Senhas são guardadas com hash (nunca em texto puro), a conexão é criptografada e o acesso
          interno a documentos é restrito a quem revisa o seu caso. Se um dia houver incidente que
          afete seus dados, você será avisado — é nossa obrigação legal e nosso compromisso.
        </p>
        <p className="mt-4 text-small text-txt-2">
          Veja também os{' '}
          <Link to="/termos" className="text-accent underline underline-offset-4">
            Termos de uso
          </Link>
          .
        </p>
      </section>
    </div>
  )
}

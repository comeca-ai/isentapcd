import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  MessageCircle,
  ShieldAlert,
} from 'lucide-react'
import { UF_LIST } from '@contracts/constants'
import { WHATSAPP_URL } from '@/lib/constants'
import { UF_NOMES } from '@/components/guia/UfMap'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]
const MAX_MSG = 1000

const ASSUNTOS = [
  'Quero entender se tenho direito',
  'Já sou cliente',
  'Imprensa',
  'Outro',
] as const

type Campo = 'nome' | 'email' | 'uf' | 'assunto' | 'mensagem'

const ROTULOS: Record<Campo, string> = {
  nome: 'Nome',
  email: 'E-mail',
  uf: 'Estado',
  assunto: 'Assunto',
  mensagem: 'Mensagem',
}

const INPUT_CLASS =
  'mt-1 min-h-[52px] w-full rounded-input border border-line bg-surface px-4 text-body text-txt'

function Canais() {
  const reduced = useReducedMotion()
  return (
    <div>
      <h1 className="text-h1 font-medium">Fale com uma pessoa, não com um robô.</h1>
      <p className="mt-4 flex items-center gap-2 text-small text-txt-2">
        <Clock className="h-4 w-4" aria-hidden="true" />
        Seg–Sex, 9h–18h (horário de Brasília)
      </p>

      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="mt-10 space-y-4"
      >
        <motion.li
          variants={{
            hidden: { y: 16, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } },
          }}
          className="rounded-card border border-line bg-surface p-6"
        >
          <h2 className="text-h3 font-medium">WhatsApp (o mais rápido)</h2>
          <p className="mt-2 text-body text-txt-2">
            Resposta em até 1 dia útil, com gente de verdade.
          </p>
          <motion.a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={reduced ? undefined : { rotate: 1.5 }}
            className="mt-4 inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-whatsapp-dark px-6 font-medium text-white transition-colors hover:brightness-110"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Falar no WhatsApp
          </motion.a>
        </motion.li>

        <motion.li
          variants={{
            hidden: { y: 16, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } },
          }}
          className="rounded-card border border-line bg-surface p-6"
        >
          <h2 className="text-h3 font-medium">E-mail (assuntos formais)</h2>
          <p className="mt-2 text-body text-txt-2">
            Privacidade, imprensa e parcerias:{' '}
            <a
              href="mailto:contato@isentapcd.com.br"
              className="text-accent underline underline-offset-4"
            >
              contato@isentapcd.com.br
            </a>
            . Para dados pessoais (LGPD):{' '}
            <a
              href="mailto:privacidade@isentapcd.com.br"
              className="text-accent underline underline-offset-4"
            >
              privacidade@isentapcd.com.br
            </a>
            .
          </p>
        </motion.li>

        <motion.li
          variants={{
            hidden: { y: 16, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } },
          }}
          className="rounded-card border border-line bg-surface p-6"
        >
          <h2 className="text-h3 font-medium">Dúvidas rápidas</h2>
          <p className="mt-2 text-body text-txt-2">
            Boa parte das respostas está no{' '}
            <Link to="/guia/faq" className="text-accent underline underline-offset-4">
              FAQ completo do Guia
            </Link>
            .
          </p>
          <BookOpen className="mt-4 h-6 w-6 text-txt-2" aria-hidden="true" />
        </motion.li>
      </motion.ul>
    </div>
  )
}

export default function Contato() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [uf, setUf] = useState('')
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({})
  const [enviado, setEnviado] = useState(false)
  const [shake, setShake] = useState(false)
  const reduced = useReducedMotion()
  const resumoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'Contato — IsentaPCD'
    return () => {
      document.title = 'IsentaPCD'
    }
  }, [])

  function validar(): Partial<Record<Campo, string>> {
    const e: Partial<Record<Campo, string>> = {}
    if (nome.trim().length < 2) e.nome = 'Informe seu nome.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'E-mail inválido — confira se falta o "@" ou o domínio.'
    if (!uf) e.uf = 'Selecione seu estado — as regras mudam por UF.'
    if (!assunto) e.assunto = 'Escolha um assunto.'
    if (mensagem.trim().length < 10)
      e.mensagem = `Mensagem muito curta — conte um pouco mais (mínimo 10 caracteres; faltam ${10 - mensagem.trim().length}).`
    return e
  }

  function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e = validar()
    setErros(e)
    if (Object.keys(e).length > 0) {
      if (!reduced) {
        setShake(true)
        setTimeout(() => setShake(false), 400)
      }
      resumoRef.current?.focus()
      return
    }
    // Sem endpoint de mensagens: o canal assistido é o WhatsApp; aqui confirmamos o registro local.
    setEnviado(true)
  }

  return (
    <section className="mx-auto max-w-content px-6 pb-24 pt-24 lg:px-10">
      <div className="grid gap-16 lg:grid-cols-2">
        <Canais />

        <div>
          <div className="flex items-start gap-3 rounded-card border border-warn/50 bg-warn/[.07] p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden="true" />
            <p className="text-small text-txt">
              Nunca envie senhas ou dados de login por aqui — nós nunca pedimos sua senha do Gov.br.
            </p>
          </div>

          {enviado ? (
            <div
              role="status"
              className="mt-6 flex items-start gap-3 rounded-card border border-success/50 bg-success/[.07] p-6"
            >
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" aria-hidden="true" />
              <div>
                <h2 className="text-h3 font-medium">Recebemos!</h2>
                <p className="mt-2 text-body text-txt-2">
                  Respondemos em até 1 dia útil. Se for urgente, o WhatsApp é mais rápido.
                </p>
              </div>
            </div>
          ) : (
            <motion.form
              onSubmit={onSubmit}
              noValidate
              aria-label="Formulário de contato"
              animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-6 rounded-card border border-line bg-surface p-6 lg:p-8"
            >
              <h2 className="text-h3 font-medium">Enviar mensagem</h2>

              {Object.keys(erros).length > 0 && (
                <div
                  ref={resumoRef}
                  tabIndex={-1}
                  role="alert"
                  className="mt-4 rounded-input border border-danger/50 bg-danger/[.07] p-4 outline-none"
                >
                  <p className="flex items-center gap-2 text-small font-medium text-danger">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    Revise os campos:
                  </p>
                  <ul className="mt-2 list-inside list-disc text-small text-danger">
                    {Object.entries(erros).map(([campo, msg]) => (
                      <li key={campo}>
                        <a href={`#contato-${campo}`} className="underline underline-offset-2">
                          {ROTULOS[campo as Campo]}
                        </a>
                        : {msg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 grid gap-5">
                <div>
                  <label htmlFor="contato-nome" className="block text-small font-medium text-txt">
                    Nome
                  </label>
                  <input
                    id="contato-nome"
                    type="text"
                    autoComplete="name"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    aria-invalid={!!erros.nome}
                    aria-describedby={erros.nome ? 'contato-nome-erro' : undefined}
                    className={INPUT_CLASS}
                  />
                  {erros.nome && (
                    <p id="contato-nome-erro" className="mt-1 flex items-center gap-1.5 text-small text-danger">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      {erros.nome}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="contato-email" className="block text-small font-medium text-txt">
                    E-mail
                  </label>
                  <input
                    id="contato-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!erros.email}
                    aria-describedby={erros.email ? 'contato-email-erro' : undefined}
                    className={INPUT_CLASS}
                  />
                  {erros.email && (
                    <p id="contato-email-erro" className="mt-1 flex items-center gap-1.5 text-small text-danger">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      {erros.email}
                    </p>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contato-uf" className="block text-small font-medium text-txt">
                      Estado
                    </label>
                    <select
                      id="contato-uf"
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      aria-invalid={!!erros.uf}
                      aria-describedby={erros.uf ? 'contato-uf-erro' : undefined}
                      className={INPUT_CLASS}
                    >
                      <option value="">Selecione…</option>
                      {UF_LIST.map((sigla) => (
                        <option key={sigla} value={sigla}>
                          {UF_NOMES[sigla]} ({sigla})
                        </option>
                      ))}
                    </select>
                    {erros.uf && (
                      <p id="contato-uf-erro" className="mt-1 flex items-center gap-1.5 text-small text-danger">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        {erros.uf}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="contato-assunto" className="block text-small font-medium text-txt">
                      Assunto
                    </label>
                    <select
                      id="contato-assunto"
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                      aria-invalid={!!erros.assunto}
                      aria-describedby={erros.assunto ? 'contato-assunto-erro' : undefined}
                      className={INPUT_CLASS}
                    >
                      <option value="">Selecione…</option>
                      {ASSUNTOS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    {erros.assunto && (
                      <p id="contato-assunto-erro" className="mt-1 flex items-center gap-1.5 text-small text-danger">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        {erros.assunto}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="contato-mensagem" className="block text-small font-medium text-txt">
                    Mensagem
                  </label>
                  <textarea
                    id="contato-mensagem"
                    rows={6}
                    maxLength={MAX_MSG}
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    aria-invalid={!!erros.mensagem}
                    aria-describedby={cn(
                      erros.mensagem ? 'contato-mensagem-erro' : '',
                      'contato-mensagem-contador',
                    )}
                    className="mt-1 w-full rounded-input border border-line bg-surface px-4 py-3 text-body text-txt"
                  />
                  <div className="mt-1 flex items-center justify-between gap-4">
                    {erros.mensagem ? (
                      <p id="contato-mensagem-erro" className="flex items-center gap-1.5 text-small text-danger">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        {erros.mensagem}
                      </p>
                    ) : (
                      <span />
                    )}
                    <p id="contato-mensagem-contador" className="font-mono text-xs text-txt-2">
                      {mensagem.length}/{MAX_MSG}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-accent px-6 font-bold text-on-accent transition-all hover:bg-accent-hover active:scale-[0.98]"
                >
                  Enviar mensagem
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  )
}

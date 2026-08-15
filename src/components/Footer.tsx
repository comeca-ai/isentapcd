import { Link } from 'react-router'
import { MessageCircle, Mail, Clock, Accessibility } from 'lucide-react'
import { LEGAL_DISCLAIMER, WHATSAPP_URL } from '@/lib/constants'
import TrustBadge from '@/components/TrustBadge'

const NAV = [
  { to: '/#como-funciona', label: 'Como funciona' },
  { to: '/guia', label: 'Guia completo' },
  { to: '/simulador', label: 'Simulador de economia' },
  { to: '/pre-analise', label: 'Pré-análise grátis' },
  { to: '/sobre', label: 'Quem somos' },
  { to: '/transparencia', label: 'Transparência' },
  { to: '/roadmap', label: 'Roadmap' },
]

const GUIA = [
  { to: '/guia/ipi', label: 'Isenção de IPI' },
  { to: '/guia/icms', label: 'Isenção de ICMS' },
  { to: '/guia/ipva', label: 'Isenção de IPVA' },
  { to: '/guia/rodizio', label: 'Rodízio' },
  { to: '/guia#por-estado', label: 'Por estado' },
]

/** Footer público (design.md §8.2) com disclaimer jurídico obrigatório. */
export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg-alt">
      <div className="mx-auto max-w-wide px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div>
            <img src="/logo.svg" alt="IsentaPCD" width={180} height={48} className="h-12 w-auto" />
            <p className="mt-4 text-small text-txt-2">
              A gente transforma a burocracia das isenções de impostos num caminho claro até o seu carro 0 km.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-success/50 px-3 py-1.5 text-small text-success">
              <Accessibility className="h-4 w-4" aria-hidden="true" />
              Feito com acessibilidade
            </p>
          </div>

          {/* Navegação */}
          <nav aria-label="Navegação do rodapé">
            <h2 className="font-display text-h3 text-txt">Navegação</h2>
            <ul className="mt-4 space-y-2.5">
              {NAV.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-small text-txt-2 underline-offset-4 hover:text-txt hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Guia */}
          <nav aria-label="Capítulos do guia">
            <h2 className="font-display text-h3 text-txt">Guia</h2>
            <ul className="mt-4 space-y-2.5">
              {GUIA.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-small text-txt-2 underline-offset-4 hover:text-txt hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contato */}
          <div>
            <h2 className="font-display text-h3 text-txt">Contato</h2>
            <ul className="mt-4 space-y-3 text-small text-txt-2">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-btn bg-whatsapp-dark px-4 font-medium text-white transition-colors hover:brightness-110"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Falar no WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <a href="mailto:contato@isentapcd.com.br" className="hover:text-txt hover:underline">
                  contato@isentapcd.com.br
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                Atendimento humano: seg a sex, 9h às 18h
              </li>
            </ul>
          </div>
        </div>

        {/* Legenda educativa dos TrustBadges */}
        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-8">
          <span className="text-small text-txt-2">Como marcamos nossos dados:</span>
          <TrustBadge level="official" />
          <TrustBadge level="secondary" />
          <TrustBadge level="check" />
          <span className="text-small text-txt-2">— sempre com texto, nunca só cor.</span>
        </div>

        {/* Disclaimer jurídico obrigatório (design.md §8.2 — todas as páginas) */}
        <div className="mt-8 border-t border-line pt-8">
          <p className="text-small text-txt-2">{LEGAL_DISCLAIMER}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/termos" className="text-small text-txt-2 underline underline-offset-4 hover:text-txt">
              Termos de uso
            </Link>
            <Link to="/privacidade" className="text-small text-txt-2 underline underline-offset-4 hover:text-txt">
              Privacidade
            </Link>
            <span className="text-small text-txt-2">
              © {new Date().getFullYear()} IsentaPCD
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

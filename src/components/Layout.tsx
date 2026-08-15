import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import Lenis from 'lenis'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Layout público (modo escuro): Navbar sticky + conteúdo + Footer + WhatsApp float.
 * Padrão "children" do contrato de roteamento (Layout envolve <Routes> em App.tsx).
 * Lenis ativo apenas no site público, desligado com prefers-reduced-motion.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion()
  const { pathname, hash } = useLocation()

  // Scroll suave Lenis (site público apenas)
  useEffect(() => {
    if (reducedMotion) return
    const lenis = new Lenis({ lerp: 0.12 })
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [reducedMotion])

  // Scroll para o topo na troca de rota / para a âncora quando há hash
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash, reducedMotion])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg text-txt">
      <Navbar />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { WHATSAPP_URL } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * CTA WhatsApp flutuante (design.md §8.3): aparece após 600px de scroll
 * e pausa quando o footer entra na viewport.
 */
export default function WhatsAppFloat() {
  const [visible, setVisible] = useState(false)
  const [footerInView, setFooterInView] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return
    const observer = new IntersectionObserver(
      ([entry]) => setFooterInView(entry.isIntersecting),
      { threshold: 0.05 },
    )
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Dúvidas? Fale com a gente no WhatsApp"
      className={cn(
        'fixed bottom-6 right-6 z-40 inline-flex min-h-[56px] items-center gap-2 rounded-full bg-whatsapp-dark px-5 font-medium text-white shadow-lg transition-all duration-300 hover:brightness-110 active:scale-[0.98]',
        visible && !footerInView
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
      <span className="hidden sm:inline">Dúvidas? Fale com a gente</span>
    </a>
  )
}

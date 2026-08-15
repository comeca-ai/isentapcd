import Hero from '@/components/home/Hero'
import StatsStrip from '@/components/home/StatsStrip'
import Audience from '@/components/home/Audience'
import HowItWorks from '@/components/home/HowItWorks'
import SimulatorTeaser from '@/components/home/SimulatorTeaser'
import Journey from '@/components/home/Journey'
import LegalProof from '@/components/home/LegalProof'
import Pricing from '@/components/home/Pricing'
import Testimonials from '@/components/home/Testimonials'
import Faq from '@/components/home/Faq'
import FinalCta from '@/components/home/FinalCta'

/** Home (/) — landing completa conforme design/home.md (S1–S11). */
export default function Home() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <Audience />
      <HowItWorks />
      <SimulatorTeaser />
      <Journey />
      <LegalProof />
      <Pricing />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  )
}

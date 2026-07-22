import type { Metadata } from 'next'

import { Navbar } from '@/components/layout/Navbar'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { HeroSection } from '@/components/landing/HeroSection'
import { PainSection } from '@/components/landing/PainSection'
import { SolutionSection } from '@/components/landing/SolutionSection'
import { OfferSection } from '@/components/landing/OfferSection'
import { GuaranteeSection } from '@/components/landing/GuaranteeSection'
import { UrgencySection } from '@/components/landing/UrgencySection'
import { FaqSection } from '@/components/landing/FaqSection'

export const metadata: Metadata = {
  title: 'Aprovus — Preparatório completo para o concurso do IBGE (R$97)',
  description:
    'Módulos, banco com 1000+ questões comentadas e 8 simulados no estilo da prova. Acesso vitalício por R$97.',
}

/**
 * Landing de vendas — direção "Institucional Premium + Urgência Agressiva".
 * Ritmo de fundos claro→escuro alterna ao rolar; seções em
 * `src/components/landing/`. Copy aprovada (não muda); aqui é execução visual.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF7]">
      <Navbar />

      <HeroSection />
      <PainSection />
      <SolutionSection />
      <OfferSection />
      <TestimonialsSection />
      <GuaranteeSection />
      <UrgencySection />
      <FaqSection />

      <footer className="mt-auto border-t border-black/[0.06] bg-[#FAFAF7] px-6 py-10 text-center text-sm text-[#5F6B66]">
        <p>
          © {new Date().getFullYear()} Aprovus{' '}
          <span className="text-[#5F6B66]/70">· por Vellum</span> —
          preparatório para o concurso do IBGE.
        </p>
      </footer>
    </div>
  )
}

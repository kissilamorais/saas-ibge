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
import { currentPriceLabel } from '@/lib/pricing'
import { getActiveTestimonials } from '@/lib/supabase/queries'

/**
 * A página é estática, então o preço exibido seria assado no build e ficaria
 * congelado depois que a oferta de lançamento vencer — anunciando um valor
 * enquanto o checkout (que roda por request) cobra outro. O ISR curto fecha
 * essa janela: na virada do prazo, a página se regenera em poucos minutos.
 */
export const revalidate = 300

export function generateMetadata(): Metadata {
  const price = currentPriceLabel()
  return {
    title: `Aprovus — Preparatório completo para o concurso do IBGE (${price})`,
    description: `Módulos, banco com 1000+ questões comentadas e 8 simulados no estilo da prova. Acesso vitalício por ${price}.`,
  }
}

/**
 * Landing de vendas — direção "Institucional Premium + Urgência Agressiva".
 * Ritmo de fundos claro→escuro alterna ao rolar; seções em
 * `src/components/landing/`. Copy aprovada (não muda); aqui é execução visual.
 */
export default async function HomePage() {
  const testimonials = await getActiveTestimonials()

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF7]">
      <Navbar />

      <HeroSection />
      <PainSection />
      <SolutionSection />
      <OfferSection />
      <TestimonialsSection testimonials={testimonials} />
      <GuaranteeSection />
      <UrgencySection />
      <FaqSection />

      <footer className="mt-auto border-t border-black/[0.06] bg-[#FAFAF7] px-6 py-10 text-center text-sm text-[#5F6B66]">
        <p>
          © {new Date().getFullYear()} Aprovus{' '}
          <span className="text-[#5F6B66]/70">· por Vellum</span> —
          preparatório para o concurso do IBGE.
        </p>
        <p className="mt-2">
          Dúvidas?{' '}
          <a
            href="mailto:suporteaprovus@gmail.com"
            className="font-medium text-[#9A6E12] underline-offset-2 hover:underline"
          >
            suporteaprovus@gmail.com
          </a>
        </p>
      </footer>
    </div>
  )
}

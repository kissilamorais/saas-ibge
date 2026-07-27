import Link from 'next/link'
import type { Metadata } from 'next'

import { Logo } from '@/components/layout/Logo'

export const metadata: Metadata = {
  title: 'Diagnóstico gratuito — Aprovus',
  description:
    'Responda 10 questões e descubra em quais matérias do concurso do IBGE você já está bem e quais precisa reforçar.',
  // Funil de captação: não deve competir com a landing na busca.
  robots: { index: false, follow: true },
}

/**
 * Shell do funil de diagnóstico (/teste/*).
 *
 * Usa a paleta da landing (petróleo/dourado/creme, fixada em landing/brand.ts)
 * e não os tokens do app: estas telas são continuação da página de vendas, não
 * do produto logado. Ver a nota de brand.ts sobre essa exceção.
 */
export default function TesteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF7] text-[#0B3D2E]">
      <header className="border-b border-[#0B3D2E]/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-[#0B3D2E]">
            <Logo />
          </Link>
        </div>
      </header>

      {children}
    </div>
  )
}

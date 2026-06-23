import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'

import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

// Sans display calma para títulos e números grandes — personalidade sem gritar.
const sora = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Aprovus — Estudo para o concurso do IBGE',
  description:
    'Plataforma de estudo online para o concurso do IBGE.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  )
}

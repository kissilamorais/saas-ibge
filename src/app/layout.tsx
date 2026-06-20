import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'SaaS IBGE - Estudo para Concurso ACA',
  description:
    'Plataforma de estudo online para o concurso de Analista de Gestão (ACA) do IBGE.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  )
}

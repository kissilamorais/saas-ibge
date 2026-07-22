import type { Metadata } from 'next'
import { Fraunces, Inter, Sora } from 'next/font/google'

import { MetaPixel } from '@/components/analytics/MetaPixel'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
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

// Serifada de peso para a landing — ar institucional, de curso sério. Inclui
// itálico para as palavras-âncora dos títulos. Usada só via `font-serif`.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const siteUrl = 'https://aprovus-ibge.vercel.app'
const title = 'Aprovus — Estudo para o concurso do IBGE'
const description = 'Plataforma de estudo online para o concurso do IBGE.'
const ogImage = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Aprovus — teoria, 1000+ questões comentadas e 8 simulados para o concurso do IBGE',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'Aprovus',
    images: [ogImage],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImage.url],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} ${fraunces.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <MetaPixel />
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  )
}

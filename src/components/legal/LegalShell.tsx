import type { ReactNode } from 'react'
import Link from 'next/link'

import { Logo } from '@/components/layout/Logo'

/**
 * Moldura das páginas legais (termos, privacidade, reembolso). Concentra o
 * chrome idêntico às três — marca, título, versão e o aviso de revisão
 * jurídica — para o conteúdo de cada documento ficar sozinho na sua page.
 *
 * O aviso usa os tokens `gold` (não `destructive`): documento em revisão é
 * ressalva, não erro — terracota fica reservada a urgência real.
 */
export function LegalShell({
  title,
  versao,
  children,
}: {
  title: string
  versao: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Aprovus — página inicial"
        >
          <Logo />
        </Link>

        <header className="mb-10 mt-8 border-b pb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aprovus · Versão {versao}
          </p>
          <p className="mt-3 rounded-md border border-gold/25 bg-gold-soft px-3 py-2 text-sm text-gold">
            Este documento está em revisão jurídica. Versão interina válida até
            publicação da versão revisada.
          </p>
        </header>

        <div className="prose prose-neutral max-w-none space-y-8 leading-relaxed text-foreground dark:prose-invert">
          {children}
        </div>

        <div className="mt-12 border-t pt-6 text-xs text-muted-foreground">
          Versão {versao} · Em revisão jurídica
        </div>
      </div>
    </main>
  )
}

/** Seção de um documento legal: título numerado + corpo. */
export function LegalSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-semibold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

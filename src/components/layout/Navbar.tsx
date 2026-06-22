import Link from 'next/link'

import { Logo } from '@/components/layout/Logo'

/** Navbar pública (landing). Para as rotas de estudo usamos a Sidebar. */
export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-foreground">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/auth/login"
            className="rounded-lg px-4 py-2 font-medium text-foreground transition-colors hover:bg-accent"
          >
            Entrar
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Começar agora
          </Link>
        </nav>
      </div>
    </header>
  )
}

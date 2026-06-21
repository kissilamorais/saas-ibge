import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

/** Navbar pública (landing). Para as rotas de estudo usamos a Sidebar. */
export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight text-white"
        >
          <GraduationCap className="h-6 w-6 text-blue-400" />
          <span>ACA IBGE</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/auth/login"
            className="rounded-lg px-4 py-2 font-medium text-slate-200 transition-colors hover:bg-white/10"
          >
            Entrar
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-400"
          >
            Começar agora
          </Link>
        </nav>
      </div>
    </header>
  )
}

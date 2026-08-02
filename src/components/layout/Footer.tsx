import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t px-6 py-6 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p>
          © {year} Aprovus{' '}
          <span className="text-muted-foreground/70">· por Vellum</span> —
          preparatório para o concurso do IBGE.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/dashboard/modules" className="hover:text-foreground">
            Módulos
          </Link>
          <Link href="/dashboard/exams" className="hover:text-foreground">
            Simulados
          </Link>
          <Link href="/termos" className="hover:text-foreground">
            Termos
          </Link>
          <Link href="/privacidade" className="hover:text-foreground">
            Privacidade
          </Link>
          <Link href="/reembolso" className="hover:text-foreground">
            Reembolso
          </Link>
          <a
            href="mailto:suporteaprovus@gmail.com"
            className="hover:text-foreground"
          >
            Suporte
          </a>
        </nav>
      </div>
    </footer>
  )
}

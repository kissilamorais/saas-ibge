import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t px-6 py-6 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p>© {year} ACA IBGE — Preparatório para concurso.</p>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/dashboard/modules" className="hover:text-foreground">
            Módulos
          </Link>
          <Link href="/dashboard/exams" className="hover:text-foreground">
            Simulados
          </Link>
        </nav>
      </div>
    </footer>
  )
}

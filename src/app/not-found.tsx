import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl font-bold text-muted-foreground">404</p>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Página não encontrada</h2>
        <p className="text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Ir para o dashboard
      </Link>
    </div>
  )
}

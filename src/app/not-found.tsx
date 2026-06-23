import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Compass className="h-7 w-7" />
      </div>
      <div className="space-y-1.5">
        <p className="font-display text-5xl font-semibold tracking-tight text-primary/30">
          404
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Página não encontrada
        </h2>
        <p className="max-w-md text-pretty text-sm text-muted-foreground">
          O link que você seguiu não existe ou foi movido. Vamos te levar de
          volta ao caminho.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Voltar ao dashboard
      </Link>
    </div>
  )
}

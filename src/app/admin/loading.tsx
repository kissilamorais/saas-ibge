import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Skeleton da Visão geral enquanto as métricas são calculadas no servidor.
 * Reproduz a grade de 6 KPIs para evitar "salto" de layout.
 */
export default function AdminOverviewLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader>
              <div className="h-5 w-44 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-56 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full animate-pulse rounded-lg bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

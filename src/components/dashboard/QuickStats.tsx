import Link from 'next/link'
import { ChevronRight, type LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface QuickStat {
  label: string
  value: string
  icon: LucideIcon
  href?: string
}

interface QuickStatsProps {
  title: string
  items: QuickStat[]
}

/**
 * Métricas de apoio — propositalmente quietas. Ficam abaixo do que motiva
 * (contagem, sequência, metas), em lista enxuta, sem competir por atenção.
 */
export function QuickStats({ title, items }: QuickStatsProps) {
  return (
    <Card className="p-5">
      <h2 className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h2>
      <ul className="divide-y divide-border">
        {items.map((item) => {
          const Icon = item.icon
          const content = (
            <>
              <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-primary/70" />
                {item.label}
              </span>
              <span className="flex items-center gap-1 text-right text-sm font-semibold tabular-nums">
                {item.value}
                {item.href && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
            </>
          )
          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    '-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent'
                  )}
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center justify-between gap-3 py-2.5">
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

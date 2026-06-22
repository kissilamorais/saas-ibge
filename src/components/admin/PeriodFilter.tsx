'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const OPTIONS = [
  ['7d', '7 dias'],
  ['30d', '30 dias'],
  ['90d', '90 dias'],
  ['all', 'Tudo'],
] as const

/**
 * Filtro de período (segmented control). Navega por query param `?period=`,
 * mantendo o pathname atual — reutilizável em qualquer página do admin.
 * A página (server component) relê o param e recalcula tudo no servidor.
 */
export function PeriodFilter({ period }: { period: string }) {
  const pathname = usePathname()

  return (
    <div
      role="tablist"
      aria-label="Período"
      className="inline-flex rounded-lg border bg-card p-1 shadow-sm"
    >
      {OPTIONS.map(([value, label]) => {
        const active = period === value
        return (
          <Link
            key={value}
            href={`${pathname}?period=${value}`}
            role="tab"
            aria-selected={active}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-secondary text-secondary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}

import { ArrowDown, ArrowUp, LucideIcon, Minus } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Delta } from '@/lib/admin/format'

interface KpiCardProps {
  title: string
  /** Valor já formatado (R$, número, %). */
  value: string
  icon: LucideIcon
  subtitle?: string
  /** Variação vs período anterior; null = sem comparação (período "tudo"). */
  delta?: Delta | null
  /**
   * Se subir é bom (receita, ativos) → verde no up. Para métricas em que subir
   * é ruim (revogações), passe false → up fica em terracota.
   */
  goodWhenUp?: boolean
}

const ARROW = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
} as const

export function KpiCard({
  title,
  value,
  icon: Icon,
  subtitle,
  delta,
  goodWhenUp = true,
}: KpiCardProps) {
  const DeltaArrow = delta ? ARROW[delta.direction] : null

  // Cor: variação "boa" = teal (success); "ruim" = terracota; neutra = muted.
  const isGood =
    delta?.direction === 'flat'
      ? null
      : (delta?.direction === 'up') === goodWhenUp
  const deltaTone =
    isGood === null
      ? 'text-muted-foreground'
      : isGood
        ? 'text-success'
        : 'text-destructive'

  return (
    <Card className="shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-semibold tracking-tight">
          {value}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {delta && DeltaArrow && (
            <span className={cn('inline-flex items-center gap-0.5 font-medium', deltaTone)}>
              <DeltaArrow className="h-3 w-3" />
              {delta.label}
            </span>
          )}
          {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

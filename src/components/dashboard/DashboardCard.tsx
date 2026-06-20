import { LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  /** Tailwind classes para colorir o ícone, ex: "text-blue-500 bg-blue-500/10" */
  accentClassName?: string
}

export function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentClassName = 'text-primary bg-primary/10',
}: DashboardCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            accentClassName
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

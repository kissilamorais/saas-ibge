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
  accentClassName = 'text-primary bg-secondary',
}: DashboardCardProps) {
  return (
    <Card className="shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
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
        {/*
         * O valor serve tanto métrica curta ("42 dias", "0/32") quanto título
         * longo ("Próxima aula"). Número curto fica grande (Sora display);
         * texto longo cai pra um tamanho legível e no máx. 2 linhas.
         */}
        <div
          className={cn(
            'font-display font-semibold tracking-tight',
            value.length <= 9
              ? 'text-3xl'
              : 'line-clamp-2 text-lg leading-snug'
          )}
        >
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

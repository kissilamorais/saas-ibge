import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ChartCardProps {
  title: string
  description?: string
  /** Quando true, mostra estado vazio no lugar do gráfico. */
  isEmpty?: boolean
  emptyLabel?: string
  children: React.ReactNode
  className?: string
}

/**
 * Moldura padrão dos gráficos do admin: título, descrição e estado vazio
 * consistente ("Foco calmo"). O gráfico (client) entra como children.
 */
export function ChartCard({
  title,
  description,
  isEmpty = false,
  emptyLabel = 'Sem dados no período.',
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

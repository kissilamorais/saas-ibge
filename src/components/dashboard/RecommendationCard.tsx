import {
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  RotateCcw,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  Recommendation,
  RecommendationKind,
  RecommendationPriority,
} from '@/lib/dashboard/recommendations'
import { cn } from '@/lib/utils'

interface RecommendationCardProps {
  recommendations: Recommendation[]
}

// Paleta serena: tudo em teal; terracota só para "fraqueza" (a única
// categoria que pede atenção). A cor encode significado, não decora.
const kindConfig: Record<
  RecommendationKind,
  { icon: LucideIcon; className: string }
> = {
  revisao: { icon: RotateCcw, className: 'text-primary bg-secondary' },
  fraqueza: {
    icon: AlertTriangle,
    className: 'text-destructive bg-destructive-soft',
  },
  ritmo: { icon: TrendingUp, className: 'text-primary bg-secondary' },
  dica: { icon: Lightbulb, className: 'text-primary bg-secondary' },
}

const priorityLabel: Record<RecommendationPriority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

const priorityBadge: Record<RecommendationPriority, string> = {
  alta: 'text-destructive bg-destructive-soft',
  media: 'text-secondary-foreground bg-secondary',
  baixa: 'text-muted-foreground bg-muted',
}

export function RecommendationCard({
  recommendations,
}: RecommendationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recomendações inteligentes</CardTitle>
        <CardDescription>
          Sugestões personalizadas com base no seu desempenho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => {
          const { icon: Icon, className } = kindConfig[rec.kind]
          const Wrapper = rec.href ? 'a' : 'div'

          return (
            <Wrapper
              key={rec.id}
              {...(rec.href ? { href: rec.href } : {})}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                rec.href && 'hover:bg-accent'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  className
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{rec.title}</p>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                      priorityBadge[rec.priority]
                    )}
                  >
                    {priorityLabel[rec.priority]}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {rec.description}
                </p>
              </div>

              {rec.href && (
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </Wrapper>
          )
        })}
      </CardContent>
    </Card>
  )
}

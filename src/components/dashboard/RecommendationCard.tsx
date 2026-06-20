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
import { cn } from '@/lib/utils'

type RecommendationPriority = 'alta' | 'media' | 'baixa'
type RecommendationKind = 'revisao' | 'fraqueza' | 'ritmo' | 'dica'

export interface Recommendation {
  id: string
  kind: RecommendationKind
  priority: RecommendationPriority
  title: string
  description: string
  /** Link de ação opcional, ex: "/dashboard/modules/portugues" */
  href?: string
}

interface RecommendationCardProps {
  recommendations?: Recommendation[]
}

const kindConfig: Record<
  RecommendationKind,
  { icon: LucideIcon; className: string }
> = {
  revisao: { icon: RotateCcw, className: 'text-orange-500 bg-orange-500/10' },
  fraqueza: { icon: AlertTriangle, className: 'text-red-500 bg-red-500/10' },
  ritmo: { icon: TrendingUp, className: 'text-emerald-500 bg-emerald-500/10' },
  dica: { icon: Lightbulb, className: 'text-amber-500 bg-amber-500/10' },
}

const priorityLabel: Record<RecommendationPriority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

const priorityBadge: Record<RecommendationPriority, string> = {
  alta: 'text-red-600 bg-red-500/10',
  media: 'text-amber-600 bg-amber-500/10',
  baixa: 'text-muted-foreground bg-muted',
}

// TODO: gerar a partir de progresso real, desempenho em quizzes e revisões pendentes
const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    kind: 'fraqueza',
    priority: 'alta',
    title: 'Reforce Raciocínio Lógico',
    description:
      'Seu aproveitamento em quizzes deste módulo está em 52%. Refaça as lições de estruturas lógicas.',
    href: '/dashboard/modules/raciocinio-logico',
  },
  {
    id: '2',
    kind: 'revisao',
    priority: 'alta',
    title: '3 revisões pendentes para hoje',
    description:
      'Concordância Verbal, Crase e Regência aguardam revisão pelo método de repetição espaçada.',
    href: '/dashboard/modules',
  },
  {
    id: '3',
    kind: 'ritmo',
    priority: 'media',
    title: 'Você está 7h atrás da meta semanal',
    description:
      'Estude +1h30 por dia até domingo para voltar ao ritmo planejado.',
  },
  {
    id: '4',
    kind: 'dica',
    priority: 'baixa',
    title: 'Faça o Simulado 3 no sábado',
    description:
      'Já cobriu 64% do edital — um simulado completo ajuda a fixar e medir o progresso.',
    href: '/dashboard/exams',
  },
]

export function RecommendationCard({
  recommendations = mockRecommendations,
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

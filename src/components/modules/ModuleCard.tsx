import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle2,
  Languages,
  Monitor,
  type LucideIcon,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface ModuleCardData {
  slug: string
  title: string
  description: string | null
  /** Nome do ícone (lucide) salvo no banco */
  icon: string | null
  completedLessons: number
  totalLessons: number
}

interface ModuleCardProps {
  module: ModuleCardData
}

// Mapeia o nome do ícone (string do banco) para o componente lucide
const iconMap: Record<string, LucideIcon> = {
  languages: Languages,
  brain: Brain,
  briefcase: Briefcase,
  monitor: Monitor,
  'book-open': BookOpen,
}

export function ModuleCard({ module }: ModuleCardProps) {
  const Icon = (module.icon && iconMap[module.icon]) || BookOpen
  const percent =
    module.totalLessons > 0
      ? Math.round((module.completedLessons / module.totalLessons) * 100)
      : 0
  const isComplete = percent === 100

  return (
    <Link href={`/dashboard/modules/${module.slug}`} className="group block">
      <Card className="flex h-full flex-col transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
            <Icon className="h-6 w-6" />
          </div>
          {isComplete && (
            <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Concluído
            </span>
          )}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col">
          <CardTitle className="text-lg">{module.title}</CardTitle>
          {module.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
              {module.description}
            </p>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {module.completedLessons}/{module.totalLessons} lições
              </span>
              <span className="font-medium">{percent}%</span>
            </div>
            <Progress value={percent} />
          </div>

          <div
            className={cn(
              'mt-4 flex items-center gap-1 text-sm font-medium text-primary',
              'opacity-0 transition-opacity group-hover:opacity-100'
            )}
          >
            {module.completedLessons > 0 ? 'Continuar' : 'Começar'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

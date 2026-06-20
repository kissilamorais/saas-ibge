import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  PlayCircle,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type LessonStatus = 'completed' | 'in_progress' | 'not_started'

interface LessonItem {
  slug: string
  title: string
  durationMinutes: number
  status: LessonStatus
}

interface ModuleDetail {
  slug: string
  title: string
  description: string
  lessons: LessonItem[]
}

// TODO: substituir por dados reais do Supabase (module + lessons + progress do usuário)
const mockModules: Record<string, ModuleDetail> = {
  portugues: {
    slug: 'portugues',
    title: 'Português',
    description:
      'Gramática, interpretação de texto, ortografia e redação oficial.',
    lessons: [
      { slug: 'interpretacao-de-texto', title: 'Interpretação de Texto', durationMinutes: 45, status: 'completed' },
      { slug: 'ortografia', title: 'Ortografia', durationMinutes: 30, status: 'completed' },
      { slug: 'acentuacao', title: 'Acentuação Gráfica', durationMinutes: 25, status: 'completed' },
      { slug: 'concordancia-verbal', title: 'Concordância Verbal', durationMinutes: 40, status: 'in_progress' },
      { slug: 'concordancia-nominal', title: 'Concordância Nominal', durationMinutes: 35, status: 'not_started' },
      { slug: 'regencia', title: 'Regência Verbal e Nominal', durationMinutes: 40, status: 'not_started' },
      { slug: 'crase', title: 'Crase', durationMinutes: 30, status: 'not_started' },
    ],
  },
  'raciocinio-logico': {
    slug: 'raciocinio-logico',
    title: 'Raciocínio Lógico',
    description:
      'Estruturas lógicas, lógica de argumentação, sequências e probabilidade.',
    lessons: [
      { slug: 'proposicoes', title: 'Proposições Lógicas', durationMinutes: 35, status: 'completed' },
      { slug: 'tabelas-verdade', title: 'Tabelas-Verdade', durationMinutes: 40, status: 'in_progress' },
      { slug: 'equivalencias', title: 'Equivalências Lógicas', durationMinutes: 30, status: 'not_started' },
      { slug: 'argumentacao', title: 'Lógica de Argumentação', durationMinutes: 45, status: 'not_started' },
    ],
  },
}

const statusConfig: Record<
  LessonStatus,
  { icon: typeof Circle; className: string; label: string }
> = {
  completed: {
    icon: CheckCircle2,
    className: 'text-emerald-500',
    label: 'Concluída',
  },
  in_progress: {
    icon: PlayCircle,
    className: 'text-primary',
    label: 'Em andamento',
  },
  not_started: {
    icon: Circle,
    className: 'text-muted-foreground/40',
    label: 'Não iniciada',
  },
}

export default function ModuleDetailPage({
  params,
}: {
  params: { moduleSlug: string }
}) {
  const module = mockModules[params.moduleSlug]

  if (!module) {
    notFound()
  }

  const completed = module.lessons.filter((l) => l.status === 'completed').length
  const total = module.lessons.length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Cabeçalho */}
      <div className="space-y-4">
        <Link
          href="/dashboard/modules"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para módulos
        </Link>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{module.title}</h1>
          <p className="text-muted-foreground">{module.description}</p>
        </div>

        <div className="max-w-md space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completed} de {total} lições concluídas
            </span>
            <span className="font-medium">{percent}%</span>
          </div>
          <Progress value={percent} />
        </div>
      </div>

      {/* Lista de lições */}
      <Card>
        <CardContent className="divide-y p-0">
          {module.lessons.map((lesson, index) => {
            const { icon: StatusIcon, className, label } =
              statusConfig[lesson.status]

            return (
              <Link
                key={lesson.slug}
                href={`/dashboard/modules/${module.slug}/${lesson.slug}`}
                className="group flex items-center gap-4 p-4 transition-colors hover:bg-accent"
              >
                <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </span>

                <StatusIcon className={cn('h-5 w-5 shrink-0', className)} />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{lesson.title}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{lesson.durationMinutes} min</span>
                    <span aria-hidden>•</span>
                    <span>{label}</span>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

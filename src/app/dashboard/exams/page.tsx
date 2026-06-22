import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
  Play,
  RotateCcw,
  Trophy,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { requireTargetFunction } from '@/lib/auth/session'
import { getExams, getUserExamStats } from '@/lib/supabase/queries'
import { cn } from '@/lib/utils'

interface ExamItem {
  slug: string
  title: string
  description: string
  questionCount: number
  durationMinutes: number
  /** Nota da última tentativa em % (null se nunca fez) */
  lastScore: number | null
  attempts: number
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

export default async function ExamsPage() {
  const profile = await requireTargetFunction()

  const [examsData, stats] = await Promise.all([
    getExams(profile.target_function),
    getUserExamStats(),
  ])
  const exams: ExamItem[] = examsData.map((e) => {
    const s = stats.get(e.id)
    return {
      slug: e.slug,
      title: e.title,
      description: e.description ?? '',
      questionCount: e.total_questions ?? 0,
      durationMinutes: e.duration_minutes ?? 0,
      lastScore: s?.lastScore ?? null,
      attempts: s?.attempts ?? 0,
    }
  })

  const completed = exams.filter((e) => e.attempts > 0)
  const scores = completed
    .map((e) => e.lastScore)
    .filter((s): s is number => s !== null)
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : null

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Simulados
        </h1>
        <p className="text-muted-foreground">
          {exams.length} simulados disponíveis • {completed.length} realizados
          {avgScore !== null && ` • média ${avgScore}%`}
        </p>
      </div>

      {/* Grid de simulados */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => {
          const done = exam.attempts > 0
          const passed = exam.lastScore !== null && exam.lastScore >= 70

          return (
            <Card key={exam.slug} className="flex h-full flex-col">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                {done && (
                  <span
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                      passed
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    {exam.lastScore}%
                  </span>
                )}
              </CardHeader>

              <CardContent className="flex flex-1 flex-col">
                <CardTitle className="text-lg">{exam.title}</CardTitle>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                  {exam.description}
                </p>

                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" />
                    {exam.questionCount} questões
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(exam.durationMinutes)}
                  </span>
                </div>

                {done && (
                  <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    {exam.attempts}{' '}
                    {exam.attempts === 1 ? 'tentativa' : 'tentativas'}
                  </p>
                )}

                <Link
                  href={`/dashboard/exams/${exam.slug}`}
                  className={cn(
                    'mt-5 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    done
                      ? 'border hover:bg-accent'
                      : 'bg-primary text-primary-foreground hover:bg-primary-hover'
                  )}
                >
                  {done ? (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Refazer simulado
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Iniciar simulado
                    </>
                  )}
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

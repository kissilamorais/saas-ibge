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

// TODO: substituir por dados reais do Supabase (exams + exam_attempts do usuário)
const mockExams: ExamItem[] = [
  {
    slug: 'simulado-1-aca',
    title: 'Simulado 1 - ACA',
    description: 'Prova completa cobrindo todo o edital do cargo ACA.',
    questionCount: 60,
    durationMinutes: 180,
    lastScore: 72,
    attempts: 2,
  },
  {
    slug: 'simulado-2-aca',
    title: 'Simulado 2 - ACA',
    description: 'Segundo simulado com foco em Administração e Conhecimentos Técnicos.',
    questionCount: 60,
    durationMinutes: 180,
    lastScore: 65,
    attempts: 1,
  },
  {
    slug: 'simulado-3-aca',
    title: 'Simulado 3 - ACA',
    description: 'Terceiro simulado com questões inéditas de todas as matérias.',
    questionCount: 60,
    durationMinutes: 180,
    lastScore: null,
    attempts: 0,
  },
  {
    slug: 'simulado-4-aca',
    title: 'Simulado 4 - ACA',
    description: 'Quarto simulado para fixação e medição de evolução.',
    questionCount: 60,
    durationMinutes: 180,
    lastScore: null,
    attempts: 0,
  },
  {
    slug: 'simulado-final-aca',
    title: 'Simulado Final - ACA',
    description: 'Simulado final no formato e nível da prova oficial.',
    questionCount: 70,
    durationMinutes: 210,
    lastScore: null,
    attempts: 0,
  },
]

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

export default function ExamsPage() {
  const exams = mockExams

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
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
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
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                {done && (
                  <span
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                      passed
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-amber-500/10 text-amber-600'
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
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
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
                      : 'bg-primary text-primary-foreground hover:opacity-90'
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

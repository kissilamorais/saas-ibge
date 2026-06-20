'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, RotateCcw, Target } from 'lucide-react'

import { QuestionCard, type QuizQuestion } from '@/components/quiz/QuestionCard'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ResultsScreenProps {
  title: string
  questions: QuizQuestion[]
  /** questionId -> optionId selecionado */
  answers: Record<string, string>
  timeSpentSeconds: number
  backHref: string
  onRetry: () => void
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}min ${s.toString().padStart(2, '0')}s`
}

export function ResultsScreen({
  title,
  questions,
  answers,
  timeSpentSeconds,
  backHref,
  onRetry,
}: ResultsScreenProps) {
  const total = questions.length
  const correct = questions.reduce((count, q) => {
    const correctOption = q.options.find((o) => o.isCorrect)
    return correctOption && answers[q.id] === correctOption.id
      ? count + 1
      : count
  }, 0)
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0
  const passed = scorePercent >= 70

  // Desempenho por matéria
  const bySubject = new Map<string, { correct: number; total: number }>()
  for (const q of questions) {
    const subject = q.subject ?? 'Geral'
    const entry = bySubject.get(subject) ?? { correct: 0, total: 0 }
    entry.total += 1
    const correctOption = q.options.find((o) => o.isCorrect)
    if (correctOption && answers[q.id] === correctOption.id) entry.correct += 1
    bySubject.set(subject, entry)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Resultado</h1>
        <p className="text-muted-foreground">{title}</p>
      </div>

      {/* Placar principal */}
      <Card className={cn('border-l-4', passed ? 'border-l-emerald-500' : 'border-l-amber-500')}>
        <CardContent className="grid gap-6 py-6 sm:grid-cols-3">
          <div className="flex flex-col items-center justify-center text-center">
            <span
              className={cn(
                'text-5xl font-bold',
                passed ? 'text-emerald-600' : 'text-amber-600'
              )}
            >
              {scorePercent}%
            </span>
            <span className="mt-1 text-sm text-muted-foreground">
              {passed ? 'Aprovado' : 'Continue estudando'}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">
                {correct}/{total}
              </p>
              <p className="text-xs text-muted-foreground">acertos</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">
                {formatTime(timeSpentSeconds)}
              </p>
              <p className="text-xs text-muted-foreground">tempo gasto</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desempenho por matéria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desempenho por matéria</CardTitle>
          <CardDescription>Acertos em cada área do simulado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from(bySubject.entries()).map(([subject, { correct, total }]) => {
            const percent = total > 0 ? Math.round((correct / total) * 100) : 0
            return (
              <div key={subject} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{subject}</span>
                  <span className="text-muted-foreground">
                    {correct}/{total} ({percent}%)
                  </span>
                </div>
                <Progress value={percent} />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RotateCcw className="h-4 w-4" />
          Refazer simulado
        </button>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos simulados
        </Link>
      </div>

      {/* Revisão das questões */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Revisão das questões</h2>
        {questions.map((question, i) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={i + 1}
            selectedOptionId={answers[question.id]}
            review
          />
        ))}
      </div>
    </div>
  )
}

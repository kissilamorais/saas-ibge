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
import type { ExamCorrection } from '@/lib/actions/study'
import { cn } from '@/lib/utils'

interface ResultsScreenProps {
  title: string
  questions: QuizQuestion[]
  /** questionId -> optionId selecionado */
  answers: Record<string, string>
  /** Correção autoritativa do servidor (nota + gabarito). */
  correction: ExamCorrection
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
  correction,
  timeSpentSeconds,
  backHref,
  onRetry,
}: ResultsScreenProps) {
  const { correctByQuestion } = correction
  const total = correction.total || questions.length
  const correct = correction.score
  const scorePercent = correction.percentage
  const passed = correction.passed

  const isAnswerCorrect = (q: QuizQuestion) =>
    correctByQuestion[q.id] !== undefined &&
    answers[q.id] === correctByQuestion[q.id]

  // Desempenho por matéria (usando o gabarito do servidor)
  const bySubject = new Map<string, { correct: number; total: number }>()
  for (const q of questions) {
    const subject = q.subject ?? 'Geral'
    const entry = bySubject.get(subject) ?? { correct: 0, total: 0 }
    entry.total += 1
    if (isAnswerCorrect(q)) entry.correct += 1
    bySubject.set(subject, entry)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Resultado
        </h1>
        <p className="text-muted-foreground">{title}</p>
      </div>

      {/* Placar principal */}
      <Card
        className={cn(
          'border-l-4',
          passed ? 'border-l-success' : 'border-l-muted-foreground/40'
        )}
      >
        <CardContent className="grid gap-6 py-6 sm:grid-cols-3">
          <div className="flex flex-col items-center justify-center text-center">
            <span
              className={cn(
                'font-display text-5xl font-semibold',
                passed ? 'text-success' : 'text-foreground'
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
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Revisão das questões
        </h2>
        {questions.map((question, i) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={i + 1}
            selectedOptionId={answers[question.id]}
            correctOptionId={correctByQuestion[question.id]}
            review
          />
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, HelpCircle, RotateCcw } from 'lucide-react'

import { QuestionCard, type QuizQuestion } from '@/components/quiz/QuestionCard'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { submitPracticeAnswers } from '@/lib/actions/study'
import { cn } from '@/lib/utils'

interface PracticeQuizProps {
  moduleTitle: string
  questions: QuizQuestion[]
  backHref: string
}

export function PracticeQuiz({
  moduleTitle,
  questions,
  backHref,
}: PracticeQuizProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [isPending, startTransition] = useTransition()

  const total = questions.length
  const allAnswered = total > 0 && Object.keys(answers).length === total

  const correctCount = questions.reduce((count, q) => {
    const correct = q.options.find((o) => o.isCorrect)
    return correct && answers[q.id] === correct.id ? count + 1 : count
  }, 0)
  const scorePercent =
    total > 0 ? Math.round((correctCount / total) * 100) : 0

  function handleSelect(questionId: string, optionId: string) {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  function handleVerify() {
    setSubmitted(true)
    setSaveError(false)
    // Registra as respostas (best-effort) para alimentar acurácia/recomendações.
    startTransition(async () => {
      const res = await submitPracticeAnswers({
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      })
      if (!res.ok) setSaveError(true)
    })
  }

  if (total === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6 md:p-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <p className="text-muted-foreground">
          Este módulo ainda não tem questões para praticar.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="space-y-1">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à prática
        </Link>
        <div className="flex items-center gap-2 pt-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">{moduleTitle}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'questão' : 'questões'} de prática
        </p>
      </div>

      {submitted && (
        <Card
          className={cn(
            'border-l-4',
            scorePercent >= 70 ? 'border-l-emerald-500' : 'border-l-amber-500'
          )}
        >
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-lg font-semibold">
                Você acertou {correctCount} de {total} ({scorePercent}%)
              </p>
              <p className="text-sm text-muted-foreground">
                {saveError
                  ? 'Não foi possível salvar este resultado, mas suas respostas estão revisadas abaixo.'
                  : isPending
                    ? 'Salvando seu desempenho…'
                    : 'Desempenho registrado. Confira a revisão abaixo.'}
              </p>
            </div>
            <div className="w-32 shrink-0">
              <Progress value={scorePercent} />
            </div>
          </CardContent>
        </Card>
      )}

      {questions.map((question, i) => (
        <QuestionCard
          key={question.id}
          question={question}
          index={i + 1}
          selectedOptionId={answers[question.id]}
          onSelect={(optionId) => handleSelect(question.id, optionId)}
          review={submitted}
        />
      ))}

      <div className="flex items-center gap-3">
        {!submitted ? (
          <>
            <button
              type="button"
              onClick={handleVerify}
              disabled={!allAnswered}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Verificar respostas
            </button>
            {!allAnswered && (
              <span className="text-sm text-muted-foreground">
                Responda todas as questões para verificar.
              </span>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" />
            Nova rodada
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Flag } from 'lucide-react'

import { QuestionCard, type QuizQuestion } from '@/components/quiz/QuestionCard'
import { ResultsScreen } from '@/components/quiz/ResultsScreen'
import { cn } from '@/lib/utils'

interface QuizEngineProps {
  title: string
  questions: QuizQuestion[]
  durationMinutes: number
  backHref: string
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function QuizEngine({
  title,
  questions,
  durationMinutes,
  backHref,
}: QuizEngineProps) {
  const totalSeconds = durationMinutes * 60

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)

  const total = questions.length
  const answeredCount = Object.keys(answers).length
  const timeSpent = totalSeconds - secondsLeft

  const handleSubmit = useCallback(() => {
    setSubmitted(true)
  }, [])

  // Timer regressivo: para ao enviar; auto-envia ao zerar
  useEffect(() => {
    if (submitted) return
    if (secondsLeft <= 0) {
      handleSubmit()
      return
    }
    const id = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [submitted, secondsLeft, handleSubmit])

  const handleSelect = useCallback(
    (optionId: string) => {
      const questionId = questions[current].id
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
    },
    [current, questions]
  )

  const handleReset = useCallback(() => {
    setAnswers({})
    setSubmitted(false)
    setSecondsLeft(totalSeconds)
    setCurrent(0)
  }, [totalSeconds])

  const lowTime = secondsLeft <= 60 && !submitted
  const question = questions[current]

  const palette = useMemo(
    () =>
      questions.map((q, i) => ({
        index: i,
        answered: Boolean(answers[q.id]),
        active: i === current,
      })),
    [questions, answers, current]
  )

  if (submitted) {
    return (
      <ResultsScreen
        title={title}
        questions={questions}
        answers={answers}
        timeSpentSeconds={timeSpent}
        backHref={backHref}
        onRetry={handleReset}
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      {/* Barra superior: título, timer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {answeredCount} de {total} respondidas
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium tabular-nums',
            lowTime && 'border-red-500 text-red-600'
          )}
        >
          <Clock className="h-4 w-4" />
          {formatClock(secondsLeft)}
        </div>
      </div>

      {/* Mapa de questões */}
      <div className="flex flex-wrap gap-2">
        {palette.map((p) => (
          <button
            key={p.index}
            type="button"
            onClick={() => setCurrent(p.index)}
            className={cn(
              'h-8 w-8 rounded-md border text-xs font-medium transition-colors',
              p.active
                ? 'border-primary bg-primary text-primary-foreground'
                : p.answered
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'hover:bg-accent'
            )}
            aria-label={`Ir para questão ${p.index + 1}`}
          >
            {p.index + 1}
          </button>
        ))}
      </div>

      {/* Questão atual */}
      <QuestionCard
        question={question}
        index={current + 1}
        selectedOptionId={answers[question.id]}
        onSelect={handleSelect}
      />

      {/* Navegação inferior */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        {current < total - 1 ? (
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Flag className="h-4 w-4" />
            Finalizar simulado
          </button>
        )}
      </div>

      {/* Finalizar sempre acessível quando há respostas pendentes */}
      {current < total - 1 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Flag className="h-4 w-4" />
            Finalizar agora ({answeredCount}/{total})
          </button>
        </div>
      )}
    </div>
  )
}

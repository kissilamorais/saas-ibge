'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Flag, Loader2 } from 'lucide-react'

import { QuestionCard, type QuizQuestion } from '@/components/quiz/QuestionCard'
import { ResultsScreen } from '@/components/quiz/ResultsScreen'
import { submitExamResult, type ExamCorrection } from '@/lib/actions/study'
import { cn } from '@/lib/utils'

interface QuizEngineProps {
  title: string
  questions: QuizQuestion[]
  durationMinutes: number
  backHref: string
  /** Se informado, salva o resultado (user_exam_results) ao finalizar. */
  examId?: string
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
  examId,
}: QuizEngineProps) {
  const totalSeconds = durationMinutes * 60

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  // Fluxo de envio: 'taking' → 'saving' → 'results' (ou 'error' com retry).
  const [phase, setPhase] = useState<'taking' | 'saving' | 'results' | 'error'>(
    'taking'
  )
  const [correction, setCorrection] = useState<ExamCorrection | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const submittingRef = useRef(false)

  const total = questions.length
  const answeredCount = Object.keys(answers).length

  // Envia ao servidor (correção + persistência) e só então mostra o resultado.
  // A nota e o gabarito vêm da resposta do servidor — nada é confiado ao cliente.
  const handleSubmit = useCallback(() => {
    if (submittingRef.current || !examId) return
    submittingRef.current = true
    const timeSpent = totalSeconds - secondsLeft
    setPhase('saving')
    void (async () => {
      const res = await submitExamResult({
        examId,
        timeSpentSeconds: timeSpent,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      })
      submittingRef.current = false
      if (res.ok) {
        setCorrection(res.result)
        setPhase('results')
      } else {
        setPhase('error')
      }
    })()
  }, [examId, totalSeconds, secondsLeft, answers])

  // Timer regressivo: para ao sair de 'taking'; auto-envia ao zerar.
  useEffect(() => {
    if (phase !== 'taking') return
    if (secondsLeft <= 0) {
      handleSubmit()
      return
    }
    const id = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [phase, secondsLeft, handleSubmit])

  const handleSelect = useCallback(
    (optionId: string) => {
      const questionId = questions[current].id
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
    },
    [current, questions]
  )

  const handleReset = useCallback(() => {
    submittingRef.current = false
    setCorrection(null)
    setAnswers({})
    setPhase('taking')
    setSecondsLeft(totalSeconds)
    setCurrent(0)
  }, [totalSeconds])

  const lowTime = secondsLeft <= 60 && phase === 'taking'
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

  // Salvando: a correção é feita no servidor; segura a tela de resultado.
  if (phase === 'saving') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Corrigindo seu simulado…</p>
      </div>
    )
  }

  // Erro ao salvar: não perde as respostas, permite tentar de novo.
  if (phase === 'error') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 p-12 text-center">
        <AlertTriangle className="h-9 w-9 text-destructive" />
        <div className="space-y-1">
          <p className="font-semibold">Não foi possível salvar seu resultado</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Suas respostas não foram perdidas. Verifique sua conexão e tente
            enviar novamente.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Tentar enviar de novo
        </button>
      </div>
    )
  }

  if (phase === 'results' && correction) {
    return (
      <ResultsScreen
        title={title}
        questions={questions}
        answers={answers}
        correction={correction}
        timeSpentSeconds={totalSeconds - secondsLeft}
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
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {answeredCount} de {total} respondidas
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition-colors',
            lowTime
              ? 'border-destructive bg-destructive-soft text-destructive'
              : 'border-border'
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
              'h-8 w-8 rounded-lg border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              p.active
                ? 'border-primary bg-primary text-primary-foreground'
                : p.answered
                  ? 'border-secondary bg-secondary text-secondary-foreground'
                  : 'border-border hover:bg-accent'
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
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

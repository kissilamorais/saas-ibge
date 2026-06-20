'use client'

import { useState } from 'react'
import { Clock, HelpCircle, RotateCcw } from 'lucide-react'

import { QuestionCard, type QuizQuestion } from '@/components/quiz/QuestionCard'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export type { QuizOption, QuizQuestion } from '@/components/quiz/QuestionCard'

export interface LessonData {
  title: string
  /** Conteúdo da lição em parágrafos (markdown simples / texto) */
  content: string
  durationMinutes: number
  quiz: QuizQuestion[]
}

interface LessonViewerProps {
  lesson: LessonData
}

export function LessonViewer({ lesson }: LessonViewerProps) {
  // Mapa: questionId -> optionId selecionado
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const totalQuestions = lesson.quiz.length
  const allAnswered =
    totalQuestions > 0 && Object.keys(answers).length === totalQuestions

  const correctCount = lesson.quiz.reduce((count, q) => {
    const correct = q.options.find((o) => o.isCorrect)
    return correct && answers[q.id] === correct.id ? count + 1 : count
  }, 0)

  const scorePercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  function handleSelect(questionId: string, optionId: string) {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  function handleReset() {
    setAnswers({})
    setSubmitted(false)
  }

  const paragraphs = lesson.content
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className="space-y-8">
      {/* Conteúdo da lição */}
      <article className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{lesson.durationMinutes} min de leitura</span>
        </div>

        <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>

      {/* Quiz integrado */}
      {totalQuestions > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Quiz da lição</h2>
            <span className="text-sm text-muted-foreground">
              {totalQuestions} {totalQuestions === 1 ? 'questão' : 'questões'}
            </span>
          </div>

          {/* Resultado após enviar */}
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
                    Você acertou {correctCount} de {totalQuestions} ({scorePercent}%)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {scorePercent >= 70
                      ? 'Bom trabalho! Você domina o conteúdo.'
                      : 'Revise o conteúdo e tente novamente.'}
                  </p>
                </div>
                <div className="w-32 shrink-0">
                  <Progress value={scorePercent} />
                </div>
              </CardContent>
            </Card>
          )}

          {lesson.quiz.map((question, qIndex) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={qIndex + 1}
              selectedOptionId={answers[question.id]}
              onSelect={(optionId) => handleSelect(question.id, optionId)}
              review={submitted}
            />
          ))}

          {/* Ações do quiz */}
          <div className="flex items-center gap-3">
            {!submitted ? (
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                disabled={!allAnswered}
                className={cn(
                  'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity',
                  'disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90'
                )}
              >
                Verificar respostas
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                <RotateCcw className="h-4 w-4" />
                Refazer quiz
              </button>
            )}
            {!submitted && !allAnswered && (
              <span className="text-sm text-muted-foreground">
                Responda todas as questões para verificar.
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

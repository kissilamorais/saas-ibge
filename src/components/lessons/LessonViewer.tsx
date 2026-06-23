'use client'

import { isValidElement, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  PartyPopper,
  RotateCcw,
} from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { QuestionCard, type QuizQuestion } from '@/components/quiz/QuestionCard'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { markLessonComplete } from '@/lib/actions/study'
import { cn } from '@/lib/utils'

export type { QuizOption, QuizQuestion } from '@/components/quiz/QuestionCard'

// Texto plano de uma subárvore de nós React (para detectar padrões no conteúdo).
function nodeText(node: ReactNode): string {
  if (node == null || node === false) return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join('')
  if (isValidElement(node)) return nodeText(node.props.children)
  return ''
}

/**
 * Renderizadores do markdown da lição — dão "presença" calma ao conteúdo:
 * - pre: mapas/esquemas ASCII viram cartão (não "terminal" escuro).
 * - p: parágrafos de questão comentada ("Q1.", "Q2.") viram cartões.
 * - strong: o "Gabarito:" ganha destaque em teal.
 */
const markdownComponents: Components = {
  pre: ({ children }) => (
    <div className="not-prose my-6 flex overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-secondary/60 to-card shadow-sm">
      <div className="w-1 shrink-0 bg-primary/40" aria-hidden />
      <pre className="flex-1 overflow-x-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-foreground/90">
        {children}
      </pre>
    </div>
  ),
  p: ({ children }) => {
    // Questão comentada (enunciado + gabarito num único parágrafo) → cartão.
    const isCommentedQuestion = /^\s*Q\d+\s*[.)]/.test(nodeText(children))
    if (isCommentedQuestion) {
      return (
        <div className="not-prose my-3 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground shadow-sm">
          {children}
        </div>
      )
    }
    return <p>{children}</p>
  },
  strong: ({ children }) => {
    if (/^\s*gabarito\b/i.test(nodeText(children))) {
      return (
        <strong className="font-semibold text-primary">{children}</strong>
      )
    }
    return <strong>{children}</strong>
  },
}

export interface LessonData {
  title: string
  /** Conteúdo da lição em parágrafos (markdown simples / texto) */
  content: string
  durationMinutes: number
  quiz: QuizQuestion[]
}

interface LessonViewerProps {
  lesson: LessonData
  /** Destino ao concluir: próxima lição (ou null na última do módulo). */
  nextHref: string | null
  completion: {
    lessonId: string
    moduleId: string
    moduleSlug: string
    completed: boolean
  }
}

export function LessonViewer({
  lesson,
  nextHref,
  completion,
}: LessonViewerProps) {
  const router = useRouter()
  // Mapa: questionId -> optionId selecionado
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [done, setDone] = useState(completion.completed)
  const [isPending, startTransition] = useTransition()

  function handleComplete() {
    startTransition(async () => {
      const res = await markLessonComplete(
        completion.lessonId,
        completion.moduleId,
        completion.moduleSlug,
        lesson.durationMinutes
      )
      if (!res.ok) return
      setDone(true)
      // Avança automaticamente: próxima lição, ou volta ao módulo na última.
      router.push(
        nextHref ?? `/dashboard/modules/${completion.moduleSlug}`
      )
    })
  }

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

  return (
    <div className="space-y-8">
      {/* Conteúdo da lição */}
      <article className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{lesson.durationMinutes} min de leitura</span>
        </div>

        <div
          className={cn(
            'prose prose-sm max-w-none dark:prose-invert',
            'prose-headings:scroll-mt-20 prose-headings:font-semibold prose-a:text-primary prose-table:text-sm',
            // Código inline: chip discreto, sem as aspas que o plugin adiciona.
            // (O bloco de código tem render próprio — ver markdownComponents.)
            'prose-code:rounded prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-secondary-foreground prose-code:before:content-none prose-code:after:content-none'
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {lesson.content}
          </ReactMarkdown>
        </div>
      </article>

      {/* Quiz integrado */}
      {totalQuestions > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Quiz da lição
            </h2>
            <span className="text-sm text-muted-foreground">
              {totalQuestions} {totalQuestions === 1 ? 'questão' : 'questões'}
            </span>
          </div>

          {/* Resultado após enviar */}
          {submitted && (
            <Card
              className={cn(
                'border-l-4',
                scorePercent >= 70
                  ? 'border-l-gold motion-safe:animate-gold-pulse'
                  : 'border-l-primary'
              )}
            >
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="flex items-center gap-2 text-lg font-semibold">
                    {scorePercent >= 70 && (
                      <PartyPopper className="h-5 w-5 text-gold" />
                    )}
                    Você acertou {correctCount} de {totalQuestions} ({scorePercent}%)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {scorePercent >= 70
                      ? 'Bom trabalho! Você domina o conteúdo.'
                      : 'Revise o conteúdo e tente novamente — você chega lá.'}
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
                  'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50'
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

      {/* Conclusão da lição */}
      <div className="flex items-center gap-3 border-t pt-6">
        {done ? (
          <span className="inline-flex items-center gap-2 rounded-lg bg-gold-soft px-3 py-1.5 text-sm font-medium text-gold motion-safe:animate-rise-in">
            <PartyPopper className="h-5 w-5" />
            Lição concluída — você avançou!
          </span>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isPending
              ? nextHref
                ? 'Avançando…'
                : 'Salvando…'
              : nextHref
                ? 'Concluir e avançar'
                : 'Concluir lição'}
          </button>
        )}
      </div>
    </div>
  )
}

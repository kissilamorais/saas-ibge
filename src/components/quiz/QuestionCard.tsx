'use client'

import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface QuizQuestion {
  id: string
  text: string
  explanation: string
  options: QuizOption[]
  /** Matéria/assunto, usado para o desempenho por área */
  subject?: string
}

interface QuestionCardProps {
  question: QuizQuestion
  /** Número exibido da questão (1-based) */
  index: number
  selectedOptionId?: string
  onSelect?: (optionId: string) => void
  /** Modo revisão: mostra acerto/erro e explicação, desabilita seleção */
  review?: boolean
}

export function QuestionCard({
  question,
  index,
  selectedOptionId,
  onSelect,
  review = false,
}: QuestionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium leading-relaxed">
          {index}. {question.text}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id
          const showCorrect = review && option.isCorrect
          const showWrong = review && isSelected && !option.isCorrect

          const letter = String.fromCharCode(
            65 + question.options.indexOf(option)
          )

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !review && onSelect?.(option.id)}
              disabled={review}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                !review && 'hover:bg-accent',
                isSelected && !review && 'border-primary bg-primary/5',
                showCorrect && 'border-emerald-500 bg-emerald-500/10',
                showWrong && 'border-red-500 bg-red-500/10'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                  isSelected && !review && 'border-primary text-primary',
                  showCorrect && 'border-emerald-500',
                  showWrong && 'border-red-500'
                )}
              >
                {showCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : showWrong ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  letter
                )}
              </span>
              <span className="flex-1">{option.text}</span>
            </button>
          )
        })}

        {review && (
          <div className="mt-2 flex gap-2 rounded-lg bg-muted p-3 text-sm">
            <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface QuizOption {
  id: string
  text: string
  /**
   * Gabarito local. Opcional de propósito: em simulados NÃO enviamos isto ao
   * cliente (evita ler a resposta no DevTools antes de responder). A revisão do
   * simulado usa `correctOptionId`, devolvido pelo servidor só após enviar.
   */
  isCorrect?: boolean
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
  /**
   * Id da opção correta vinda do servidor (simulado). Quando informado, tem
   * precedência sobre `option.isCorrect` para destacar a resposta na revisão.
   */
  correctOptionId?: string
}

export function QuestionCard({
  question,
  index,
  selectedOptionId,
  onSelect,
  review = false,
  correctOptionId,
}: QuestionCardProps) {
  const isOptionCorrect = (option: QuizOption) =>
    correctOptionId !== undefined
      ? option.id === correctOptionId
      : Boolean(option.isCorrect)

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-3 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Questão {index}
          </span>
          {question.subject && (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {question.subject}
            </span>
          )}
        </div>
        <CardTitle className="max-w-[62ch] text-lg font-medium leading-relaxed">
          {question.text}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id
          const optionCorrect = isOptionCorrect(option)
          const showCorrect = review && optionCorrect
          const showWrong = review && isSelected && !optionCorrect

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
                'flex w-full items-center gap-3.5 rounded-xl border p-4 text-left text-[15px] transition-all duration-200 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                !review &&
                  'hover:border-secondary hover:bg-accent disabled:cursor-default',
                isSelected && !review && 'border-primary bg-primary/[0.06]',
                showCorrect && 'border-success bg-success-soft',
                showWrong && 'border-destructive bg-destructive-soft'
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold text-muted-foreground transition-colors',
                  isSelected && !review && 'border-primary text-primary',
                  showCorrect &&
                    'border-success bg-success text-success-foreground',
                  showWrong &&
                    'border-destructive bg-destructive text-destructive-foreground'
                )}
              >
                {showCorrect ? (
                  <CheckCircle2
                    className={cn(
                      'h-4 w-4',
                      // Sua escolha certa ganha um "assentar" calmo de celebração.
                      isSelected && 'motion-safe:animate-pop'
                    )}
                  />
                ) : showWrong ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  letter
                )}
              </span>
              <span className="flex-1">{option.text}</span>
            </button>
          )
        })}

        {review && (
          <div className="mt-1 flex gap-2.5 rounded-xl bg-secondary p-4 text-sm leading-relaxed text-foreground">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              <span className="font-semibold text-secondary-foreground">
                Por quê:{' '}
              </span>
              {question.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

import { updateStudyConfig } from '@/lib/actions/profile'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface StudyConfigFormProps {
  initial: {
    examDate: string // 'YYYY-MM-DD' ou ''
    dailyGoalHours: number
    weeklyGoalHours: number
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: 'Verifique os valores informados.',
  weekly_lt_daily: 'A meta semanal não pode ser menor que a diária.',
  not_authenticated: 'Sua sessão expirou. Entre novamente.',
  unexpected_error: 'Algo deu errado. Tente novamente.',
}

const inputClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function StudyConfigForm({ initial }: StudyConfigFormProps) {
  const [examDate, setExamDate] = useState(initial.examDate)
  const [dailyGoalHours, setDailyGoalHours] = useState(
    String(initial.dailyGoalHours)
  )
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(
    String(initial.weeklyGoalHours)
  )
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('idle')
    setError(null)
    startTransition(async () => {
      const res = await updateStudyConfig({
        examDate,
        dailyGoalHours,
        weeklyGoalHours,
      })
      if (res.ok) {
        setStatus('saved')
      } else {
        setStatus('error')
        setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.unexpected_error)
      }
    })
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base">Configuração de estudo</CardTitle>
        <CardDescription>
          Defina a data da prova e suas metas. Isso alimenta o countdown e os
          medidores de meta da dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="examDate" className="text-sm font-medium">
              Data da prova
            </label>
            <input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="dailyGoal" className="text-sm font-medium">
                Meta diária (h)
              </label>
              <input
                id="dailyGoal"
                type="number"
                min={1}
                max={24}
                required
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="weeklyGoal" className="text-sm font-medium">
                Meta semanal (h)
              </label>
              <input
                id="weeklyGoal"
                type="number"
                min={1}
                max={168}
                required
                value={weeklyGoalHours}
                onChange={(e) => setWeeklyGoalHours(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {status === 'saved' && (
            <p
              role="status"
              aria-live="polite"
              className="rounded-md bg-success/10 px-3 py-2 text-sm text-success"
            >
              Configuração salva.
            </p>
          )}
          {status === 'error' && error && (
            <p
              role="alert"
              aria-live="assertive"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </button>
        </form>
      </CardContent>
    </Card>
  )
}

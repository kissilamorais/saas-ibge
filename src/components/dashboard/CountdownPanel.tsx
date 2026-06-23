import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CountdownPanelProps {
  daysUntilExam: number | null
  examDateLabel: string | null
  weeklyHoursDone: number
  weeklyGoalHours: number
}

/**
 * Contagem regressiva como destaque (não como card minúsculo): número grande,
 * microcopy encorajador e a fase muda de tom conforme a prova se aproxima —
 * teal no ritmo normal, dourado na reta final, terracota só no foco total.
 */
export function CountdownPanel({
  daysUntilExam,
  examDateLabel,
  weeklyHoursDone,
  weeklyGoalHours,
}: CountdownPanelProps) {
  const weekPct =
    weeklyGoalHours > 0
      ? Math.min(100, Math.round((weeklyHoursDone / weeklyGoalHours) * 100))
      : 0

  if (daysUntilExam === null) {
    return (
      <Card className="flex flex-col justify-between gap-4 p-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Contagem regressiva
        </div>
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight">
            Quando é a sua prova?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina a data e a gente mostra quanto tempo falta.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-flex w-fit items-center rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent"
        >
          Definir data da prova
        </Link>
      </Card>
    )
  }

  // Fase da reta: encode tempo restante em cor + microcopy.
  const phase =
    daysUntilExam <= 7
      ? { tone: 'urgent', copy: 'Agora é foco total.' }
      : daysUntilExam <= 30
        ? { tone: 'final', copy: 'Reta final — mantém o ritmo!' }
        : { tone: 'steady', copy: 'No seu ritmo. Bora!' }

  return (
    <Card className="flex flex-col justify-between gap-5 p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Contagem regressiva
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            phase.tone === 'urgent' && 'bg-destructive-soft text-destructive',
            phase.tone === 'final' && 'bg-gold-soft text-gold',
            phase.tone === 'steady' && 'bg-secondary text-secondary-foreground'
          )}
        >
          {phase.copy}
        </span>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'font-display text-6xl font-semibold tabular-nums tracking-tight',
              phase.tone === 'urgent' ? 'text-destructive' : 'text-foreground'
            )}
          >
            {daysUntilExam}
          </span>
          <span className="text-lg font-medium text-muted-foreground">
            {daysUntilExam === 1 ? 'dia' : 'dias'}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {examDateLabel ? `Prova marcada para ${examDateLabel}` : 'para a prova'}
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Ritmo da semana</span>
          <span className="tabular-nums">
            {weeklyHoursDone}/{weeklyGoalHours}h
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-700 ease-out',
              weekPct >= 100 ? 'bg-gold' : 'bg-primary'
            )}
            style={{ width: `${weekPct}%` }}
          />
        </div>
      </div>
    </Card>
  )
}

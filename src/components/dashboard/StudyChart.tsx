import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface StudyDay {
  /** Rótulo curto do dia, ex: "Seg" */
  label: string
  /** Horas estudadas no dia */
  hours: number
}

interface StudyChartProps {
  data?: StudyDay[]
  /** Meta diária de horas — desenha a linha de referência */
  dailyGoalHours?: number
}

// TODO: substituir por dados reais do Supabase (study_sessions agrupadas por dia)
const mockData: StudyDay[] = [
  { label: 'Seg', hours: 3.5 },
  { label: 'Ter', hours: 4 },
  { label: 'Qua', hours: 2 },
  { label: 'Qui', hours: 5 },
  { label: 'Sex', hours: 1.5 },
  { label: 'Sáb', hours: 4.5 },
  { label: 'Dom', hours: 2.5 },
]

export function StudyChart({
  data = mockData,
  dailyGoalHours = 4,
}: StudyChartProps) {
  const maxHours = Math.max(dailyGoalHours, ...data.map((d) => d.hours))
  const totalHours = data.reduce((sum, d) => sum + d.hours, 0)
  const avgHours = data.length > 0 ? totalHours / data.length : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Horas estudadas</CardTitle>
        <CardDescription>
          Últimos 7 dias • {totalHours.toFixed(1)}h no total • média{' '}
          {avgHours.toFixed(1)}h/dia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative flex h-48 items-end justify-between gap-2 sm:gap-3">
          {/* Linha de meta diária */}
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/40"
            style={{ bottom: `${(dailyGoalHours / maxHours) * 100}%` }}
          >
            <span className="absolute -top-5 right-0 text-[10px] text-muted-foreground">
              meta {dailyGoalHours}h
            </span>
          </div>

          {data.map((day) => {
            const heightPercent = maxHours > 0 ? (day.hours / maxHours) * 100 : 0
            const metGoal = day.hours >= dailyGoalHours

            return (
              <div
                key={day.label}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {day.hours}h
                </span>
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all',
                    // Bater a meta do dia "esquenta" a barra em dourado.
                    metGoal
                      ? 'bg-gold'
                      : 'bg-primary/40 group-hover:bg-primary/60'
                  )}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-xs text-muted-foreground">
                  {day.label}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

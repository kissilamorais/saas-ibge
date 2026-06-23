import { Flame } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StreakCardProps {
  currentStreak: number
  bestStreak: number
}

/**
 * Sequência de dias estudando — a recompensa de constância. A chama acende em
 * dourado quando há sequência viva; apagada (e convidativa) quando zerada.
 */
export function StreakCard({ currentStreak, bestStreak }: StreakCardProps) {
  const active = currentStreak > 0
  const isRecord = active && currentStreak >= bestStreak && currentStreak > 1

  return (
    <Card className="flex items-center gap-4 p-5">
      <div
        className={cn(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
          active ? 'bg-gold-soft text-gold' : 'bg-muted text-muted-foreground'
        )}
      >
        <Flame
          className={cn('h-7 w-7', active && 'motion-safe:animate-rise-in')}
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Sequência
        </p>
        {active ? (
          <>
            <p className="font-display text-2xl font-semibold tracking-tight">
              {currentStreak} {currentStreak === 1 ? 'dia' : 'dias'} seguidos
            </p>
            <p className="text-sm text-muted-foreground">
              {isRecord ? (
                <span className="font-medium text-gold">Seu novo recorde!</span>
              ) : (
                `Recorde: ${bestStreak} ${bestStreak === 1 ? 'dia' : 'dias'}`
              )}
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl font-semibold tracking-tight">
              Comece hoje
            </p>
            <p className="text-sm text-muted-foreground">
              Estude um pouco e acenda sua sequência.
            </p>
          </>
        )}
      </div>
    </Card>
  )
}

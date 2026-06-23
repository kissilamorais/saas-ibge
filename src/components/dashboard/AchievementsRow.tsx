import { Check, Lock } from 'lucide-react'

import type { Achievement } from '@/lib/dashboard/achievements'
import { cn } from '@/lib/utils'

interface AchievementsRowProps {
  achievements: Achievement[]
}

/**
 * Marcos da jornada — maduros, nunca infantis. Conquistado acende em dourado;
 * pendente fica num contorno calmo que mostra o que vem a seguir. Dá um senso
 * de progressão sem pressionar.
 */
export function AchievementsRow({ achievements }: AchievementsRowProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Conquistas
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">
          {unlockedCount} de {achievements.length}
        </span>
      </div>
      <ul className="flex flex-wrap gap-2.5">
        {achievements.map((a) => (
          <li
            key={a.id}
            title={a.hint}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              a.unlocked
                ? 'border-gold/30 bg-gold-soft font-medium text-gold'
                : 'border-dashed border-border text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full',
                a.unlocked ? 'bg-gold text-gold-foreground' : 'bg-muted'
              )}
            >
              {a.unlocked ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : (
                <Lock className="h-2.5 w-2.5" />
              )}
            </span>
            {a.label}
          </li>
        ))}
      </ul>
    </section>
  )
}

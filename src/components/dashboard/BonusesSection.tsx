import Link from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'

import type { BonusView } from '@/lib/bonuses/access'
import { formatUnlockDate } from '@/lib/bonuses/unlock'
import { cn } from '@/lib/utils'

interface BonusesSectionProps {
  bonuses: BonusView[]
}

/** Texto do contador para um bônus bloqueado. */
function lockedLabel({ needsPurchase, timeUnlocked, daysUntil, unlockOn }: BonusView): {
  primary: string
  secondary: string | null
} {
  // Já pagaria, mas ainda não abriu no tempo.
  if (!timeUnlocked) {
    if (daysUntil === null) {
      // Regra por compra sem data de compra (ex.: visitante ainda não comprou).
      return { primary: 'Disponível após a compra', secondary: null }
    }
    if (daysUntil === 0) {
      return { primary: 'Desbloqueia hoje', secondary: null }
    }
    const dias = daysUntil === 1 ? '1 dia' : `${daysUntil} dias`
    return {
      primary: `Desbloqueia em ${dias}`,
      secondary: unlockOn ? formatUnlockDate(unlockOn) : null,
    }
  }
  // Está dentro da janela de tempo, mas não pagou.
  if (needsPurchase) {
    return { primary: 'Disponível após a compra', secondary: null }
  }
  return { primary: 'Bloqueado', secondary: null }
}

/**
 * Bônus da jornada — mostrados SEMPRE, todos os quatro, mesmo bloqueados, para
 * dar percepção de valor. Aberto: card ativo com CTA. Bloqueado: cadeado calmo +
 * contador "Desbloqueia em X dias". A entrega do conteúdo real é gated no
 * servidor (página do bônus + /api/bonus/[slug]); esconder aqui é só cosmético.
 */
export function BonusesSection({ bonuses }: BonusesSectionProps) {
  const unlockedCount = bonuses.filter((b) => b.unlocked).length

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Bônus da jornada
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">
          {unlockedCount} de {bonuses.length} liberados
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {bonuses.map((view) => {
          const { bonus, unlocked } = view
          const Icon = bonus.icon

          if (unlocked) {
            return (
              <li key={bonus.slug}>
                <Link
                  href={`/dashboard/bonus/${bonus.slug}`}
                  className="group flex h-full items-start gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium">{bonus.title}</p>
                      <ArrowRight className="h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {bonus.description}
                    </p>
                    <p className="mt-2 text-xs font-medium text-primary">
                      Liberado — acessar
                    </p>
                  </div>
                </Link>
              </li>
            )
          }

          const label = lockedLabel(view)
          return (
            <li key={bonus.slug}>
              <div
                aria-disabled
                className={cn(
                  'flex h-full items-start gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-4',
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <p className="font-medium">{bonus.title}</p>
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground/80">
                    {bonus.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-foreground/70">
                    {label.primary}
                    {label.secondary && (
                      <span className="font-normal text-muted-foreground">
                        {' · '}
                        {label.secondary}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

import { cn } from '@/lib/utils'

interface GoalRingProps {
  /** Progresso atual (mesma unidade de `max`). */
  value: number
  /** Meta. */
  max: number
  /** Rótulo da meta, ex: "Hoje". */
  label: string
  /** Unidade exibida no centro, ex: "h". */
  unit?: string
  size?: number
}

/**
 * Anel de meta — a assinatura calma da dashboard. Preenche em teal e, ao bater
 * 100%, troca para dourado com um halo único (a recompensa "esquenta"). O valor
 * fica sempre em texto no centro, então a informação não depende só da cor.
 */
export function GoalRing({
  value,
  max,
  label,
  unit = 'h',
  size = 76,
}: GoalRingProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const complete = pct >= 100
  const stroke = 7
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'relative shrink-0 rounded-full',
          complete && 'motion-safe:animate-gold-pulse'
        )}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={`${label}: ${value} de ${max} ${unit}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={complete ? 'hsl(var(--gold))' : 'hsl(var(--primary))'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center font-display text-sm font-semibold tabular-nums',
            complete ? 'text-gold' : 'text-foreground'
          )}
        >
          {Math.round(pct)}%
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm tabular-nums text-muted-foreground">
          {value} / {max} {unit}
        </p>
      </div>
    </div>
  )
}

import { formatInt, formatPct } from '@/lib/admin/format'
import type { FunnelData } from '@/lib/admin/charts'
import { cn } from '@/lib/utils'

/**
 * Funil visitantes → cadastros → pagantes. "Visitantes" ainda não é rastreado
 * (precisa de analytics de pageview na landing), então a etapa aparece como
 * pendente. As barras têm largura proporcional ao topo conhecido (cadastros).
 */
export function FunnelChart({ data }: { data: FunnelData }) {
  const base = Math.max(data.signups, data.payers, 1)

  const stages = [
    {
      label: 'Visitantes',
      value: data.visitors,
      pending: data.visitors === null,
      tone: 'bg-muted',
      width: data.visitors === null ? 100 : (data.visitors / base) * 100,
    },
    {
      label: 'Cadastros (leads)',
      value: data.signups,
      pending: false,
      tone: 'bg-chart-2',
      width: (data.signups / base) * 100,
    },
    {
      label: 'Pagantes',
      value: data.payers,
      pending: false,
      tone: 'bg-chart-1',
      width: (data.payers / base) * 100,
    },
  ]

  return (
    <div className="space-y-4 py-2">
      {stages.map((s) => (
        <div key={s.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{s.label}</span>
            <span className="text-muted-foreground">
              {s.pending ? 'não rastreado' : formatInt(s.value as number)}
            </span>
          </div>
          <div className="h-8 w-full overflow-hidden rounded-md bg-muted/40">
            {s.pending ? (
              <div className="flex h-full items-center px-3 text-xs text-muted-foreground">
                pendente de rastreamento (analytics da landing)
              </div>
            ) : (
              <div
                className={cn('h-full rounded-md transition-all', s.tone)}
                style={{ width: `${Math.max(s.width, 2)}%` }}
              />
            )}
          </div>
        </div>
      ))}

      <p className="pt-1 text-xs text-muted-foreground">
        Conversão cadastro → pagante:{' '}
        <span className="font-medium text-foreground">
          {data.signups > 0
            ? formatPct((data.payers / data.signups) * 100)
            : '—'}
        </span>
      </p>
    </div>
  )
}

import { Badge } from '@/components/ui/badge'
import type { LeadFollowupStatus } from '@/types'

const MAP: Record<
  LeadFollowupStatus,
  { label: string; variant: 'muted' | 'secondary' | 'success' | 'destructive' }
> = {
  none: { label: 'Novo', variant: 'muted' },
  contacted: { label: 'Contatado', variant: 'secondary' },
  converted: { label: 'Convertido', variant: 'success' },
  lost: { label: 'Perdido', variant: 'destructive' },
}

export const LEAD_STATUS_OPTIONS = (
  Object.keys(MAP) as LeadFollowupStatus[]
).map((value) => ({ value, label: MAP[value].label }))

export function LeadStatusBadge({ status }: { status: LeadFollowupStatus }) {
  const { label, variant } = MAP[status] ?? MAP.none
  return <Badge variant={variant}>{label}</Badge>
}

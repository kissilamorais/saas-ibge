import { createAdminClient } from '@/lib/supabase/admin'
import type { LeadFollowupStatus, UserProfile } from '@/types'

/**
 * Dados de leads para o admin. Lead = cadastrou mas ainda NÃO pagou
 * (purchase_date is null). Server-only via service_role.
 */

const DAY = 86400000

export interface LeadRow {
  id: string
  email: string
  full_name: string | null
  created_at: string
  utm_source: string | null
  utm_campaign: string | null
  lead_followup_status: LeadFollowupStatus
}

export interface OriginCount {
  source: string
  count: number
}

export interface LeadsOverview {
  totalLeads: number
  totalPayers: number
  conversion: number // %
  avgDaysToConvert: number | null
  byOrigin: OriginCount[]
  leads: LeadRow[]
}

export async function getLeadsOverview(): Promise<LeadsOverview> {
  const admin = createAdminClient()

  const [leadsCountRes, payersCountRes, payersTimingRes, leadsRes] =
    await Promise.all([
      admin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .is('purchase_date', null),
      admin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('purchase_date', 'is', null),
      admin
        .from('profiles')
        .select('created_at, purchase_date')
        .not('purchase_date', 'is', null),
      admin
        .from('profiles')
        .select(
          'id, email, full_name, created_at, utm_source, utm_campaign, lead_followup_status'
        )
        .is('purchase_date', null)
        .order('created_at', { ascending: false })
        .limit(200),
    ])

  const totalLeads = leadsCountRes.count ?? 0
  const totalPayers = payersCountRes.count ?? 0
  const signups = totalLeads + totalPayers
  const conversion = signups > 0 ? (totalPayers / signups) * 100 : 0

  // Tempo médio até converter (dias) entre os pagantes.
  const timings = payersTimingRes.data ?? []
  let avgDaysToConvert: number | null = null
  if (timings.length > 0) {
    const totalDays = timings.reduce((acc, r) => {
      const created = new Date(r.created_at as string).getTime()
      const paid = new Date(r.purchase_date as string).getTime()
      return acc + Math.max(0, paid - created) / DAY
    }, 0)
    avgDaysToConvert = totalDays / timings.length
  }

  const leads = (leadsRes.data ?? []) as LeadRow[]

  // Leads por origem (utm_source; null → "Direto").
  const originMap = new Map<string, number>()
  for (const l of leads) {
    const src = l.utm_source?.trim() || 'Direto'
    originMap.set(src, (originMap.get(src) ?? 0) + 1)
  }
  const byOrigin: OriginCount[] = Array.from(originMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalLeads,
    totalPayers,
    conversion,
    avgDaysToConvert,
    byOrigin,
    leads,
  }
}

export async function getLead(id: string): Promise<UserProfile | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return (data as UserProfile | null) ?? null
}

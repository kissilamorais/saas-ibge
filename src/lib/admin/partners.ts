import { createAdminClient } from '@/lib/supabase/admin'
import type { ComplimentaryAccess } from '@/types'

/**
 * Cortesias de parceiro para o admin. Server-only via service_role.
 * Cada item traz status calculado, se o e-mail já tem conta, e quem concedeu.
 */

export type CourtesyStatus = 'active' | 'expired' | 'revoked'

export interface CourtesyRow extends ComplimentaryAccess {
  status: CourtesyStatus
  hasAccount: boolean
  grantedByEmail: string | null
}

export interface PartnersOverview {
  activeCount: number
  rows: CourtesyRow[]
}

function statusOf(c: ComplimentaryAccess, now: number): CourtesyStatus {
  if (c.revoked_at) return 'revoked'
  if (c.expires_at && new Date(c.expires_at).getTime() <= now) return 'expired'
  return 'active'
}

export async function getPartnersOverview(): Promise<PartnersOverview> {
  const admin = createAdminClient()
  const now = Date.now()

  const { data } = await admin
    .from('complimentary_access')
    .select('*')
    .order('granted_at', { ascending: false })

  const list = (data ?? []) as ComplimentaryAccess[]

  // Quais e-mails já têm conta (cortesia vale na hora do cadastro também).
  const emails = Array.from(new Set(list.map((c) => c.email.toLowerCase())))
  const accountEmails = new Set<string>()
  if (emails.length > 0) {
    const { data: profs } = await admin
      .from('profiles')
      .select('email')
      .in('email', emails)
    for (const p of profs ?? []) {
      accountEmails.add(String(p.email).toLowerCase())
    }
  }

  // Quem concedeu (mapa id → email).
  const granterIds = Array.from(
    new Set(list.map((c) => c.granted_by).filter(Boolean) as string[])
  )
  const granterEmail = new Map<string, string>()
  if (granterIds.length > 0) {
    const { data: granters } = await admin
      .from('profiles')
      .select('id, email')
      .in('id', granterIds)
    for (const g of granters ?? []) {
      granterEmail.set(String(g.id), String(g.email))
    }
  }

  const rows: CourtesyRow[] = list.map((c) => ({
    ...c,
    status: statusOf(c, now),
    hasAccount: accountEmails.has(c.email.toLowerCase()),
    grantedByEmail: c.granted_by ? granterEmail.get(c.granted_by) ?? null : null,
  }))

  return {
    activeCount: rows.filter((r) => r.status === 'active').length,
    rows,
  }
}

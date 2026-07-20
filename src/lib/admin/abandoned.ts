import { createAdminClient } from '@/lib/supabase/admin'
import type { AbandonedCheckout } from '@/types'

/**
 * Checkouts abandonados para o admin. Abandono = Checkout Session da Stripe
 * que expirou sem pagamento (evento checkout.session.expired).
 * Server-only via service_role.
 */

export interface AbandonedOverview {
  total: number
  recovered: number
  pending: number
  /** % de abandonos que viraram compra. */
  recoveryRate: number
  /** Soma em centavos dos abandonos ainda não recuperados. */
  pendingValueCents: number
  rows: AbandonedCheckout[]
}

export async function getAbandonedOverview(): Promise<AbandonedOverview> {
  const admin = createAdminClient()

  const [totalRes, recoveredRes, rowsRes] = await Promise.all([
    admin
      .from('abandoned_checkouts')
      .select('*', { count: 'exact', head: true }),
    admin
      .from('abandoned_checkouts')
      .select('*', { count: 'exact', head: true })
      .not('recovered_at', 'is', null),
    admin
      .from('abandoned_checkouts')
      .select('*')
      .order('expired_at', { ascending: false })
      .limit(200),
  ])

  const total = totalRes.count ?? 0
  const recovered = recoveredRes.count ?? 0
  const rows = (rowsRes.data ?? []) as AbandonedCheckout[]

  // Valor pendente calculado sobre as linhas carregadas (as 200 mais recentes),
  // que é o mesmo recorte que a tabela exibe — assim o número bate com a lista.
  const pendingValueCents = rows
    .filter((r) => !r.recovered_at)
    .reduce((acc, r) => acc + (r.amount_cents ?? 0), 0)

  return {
    total,
    recovered,
    pending: total - recovered,
    recoveryRate: total > 0 ? (recovered / total) * 100 : 0,
    pendingValueCents,
    rows,
  }
}

/** A recovery URL da Stripe tem validade; depois disso o link não abre mais. */
export function isRecoveryLinkUsable(row: AbandonedCheckout): boolean {
  if (!row.recovery_url) return false
  if (!row.recovery_expires_at) return true
  return new Date(row.recovery_expires_at).getTime() > Date.now()
}

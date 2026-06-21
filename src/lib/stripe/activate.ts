import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * Marca o acesso do usuário como ativo após pagamento confirmado.
 * Chamado pelo webhook e pela verificação da página de sucesso.
 * Usa o client admin (service_role) — só rode após confirmar o pagamento na Stripe.
 *
 * Idempotente: se o usuário já está ativo, não reescreve a `purchase_date`
 * (importante porque webhook + página de sucesso podem ativar o mesmo pagamento).
 */
export async function activateUserAccess(
  userId: string,
  opts?: { stripeCustomerId?: string | null }
) {
  const admin = createAdminClient()

  const { data: current } = await admin
    .from('profiles')
    .select('subscription_status, purchase_date')
    .eq('id', userId)
    .maybeSingle()

  const alreadyActive =
    (current as { subscription_status: string | null } | null)
      ?.subscription_status === 'active'

  const payload: ProfileUpdate = {
    subscription_status: 'active',
    course_access_until: null, // compra única = acesso vitalício
    // preserva a data da 1ª ativação em reentregas do mesmo evento
    ...(alreadyActive
      ? {}
      : { purchase_date: new Date().toISOString() }),
    ...(opts?.stripeCustomerId
      ? { stripe_customer_id: opts.stripeCustomerId }
      : {}),
  }

  const { error } = await admin.from('profiles').update(payload).eq('id', userId)

  if (error) throw error
}

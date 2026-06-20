import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * Marca o acesso do usuário como ativo após pagamento confirmado.
 * Chamado pelo webhook e pela verificação da página de sucesso.
 * Usa o client admin (service_role) — só rode após confirmar o pagamento na Stripe.
 */
export async function activateUserAccess(
  userId: string,
  opts?: { stripeCustomerId?: string | null }
) {
  const admin = createAdminClient()

  const payload: ProfileUpdate = {
    subscription_status: 'active',
    purchase_date: new Date().toISOString(),
    course_access_until: null, // compra única = acesso vitalício
    ...(opts?.stripeCustomerId
      ? { stripe_customer_id: opts.stripeCustomerId }
      : {}),
  }

  // cast: o Database escrito à mão faz o update inferir `never` como input
  const { error } = await admin
    .from('profiles')
    .update(payload as never)
    .eq('id', userId)

  if (error) throw error
}

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * Marca o acesso do usuário como ativo após pagamento confirmado.
 * Agnóstica ao provedor — só escreve em `profiles`. Usa o client admin
 * (service_role), então só rode depois de confirmar o pagamento na origem.
 *
 * Idempotente: preserva a `purchase_date` já preenchida em reentregas do mesmo
 * pagamento (webhook + safety net podem ativar o mesmo evento). Mas se ela
 * estiver `null`, faz o backfill agora — inclusive quando a conta já estava
 * `active` sem data (ex.: acesso de cortesia/admin que depois vira compra real).
 * Sem isso, os bônus com offset de dias (que dependem de `purchase_date`) nunca
 * abririam para essa conta.
 */
export async function activateUserAccess(userId: string) {
  const admin = createAdminClient()

  const { data: current } = await admin
    .from('profiles')
    .select('subscription_status, purchase_date')
    .eq('id', userId)
    .maybeSingle()

  const hasPurchaseDate =
    (current as { purchase_date: string | null } | null)?.purchase_date != null

  const payload: ProfileUpdate = {
    subscription_status: 'active',
    course_access_until: null, // compra única = acesso vitalício
    // Só grava purchase_date se ainda não houver — preserva a 1ª compra em
    // reentregas e faz backfill quando null (o gate temporal dos bônus depende
    // dela; ver src/lib/bonuses/unlock.ts).
    ...(hasPurchaseDate ? {} : { purchase_date: new Date().toISOString() }),
  }

  const { error } = await admin.from('profiles').update(payload).eq('id', userId)

  if (error) throw error
}

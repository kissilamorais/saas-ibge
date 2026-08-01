'use server'

import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { reportError, log } from '@/lib/observability/log'

/**
 * "Excluir minha conta" (LGPD art. 18, VI — eliminação). `auth.admin.deleteUser`
 * apaga a linha em `auth.users`; `profiles.id` e todo o resto do histórico do
 * usuário (`user_progress`, `user_answers`, `study_sessions`,
 * `user_exam_results`, `free_trial_results`) têm `on delete cascade` até
 * `auth.users` (schema.sql/0012) — uma única chamada já purga tudo.
 *
 * NÃO apaga `pending_orders`/`abandoned_checkouts`/`trial_leads` (vínculo por
 * e-mail, não por user_id): são registro comercial/fiscal retido por
 * obrigação legal (CDC/contábil), não dado pessoal de estudo.
 *
 * Sem `useFormState`: falha aqui é só `not_authenticated` (a página já exige
 * sessão) ou `rate_limited`/erro do Auth — casos raros o bastante para o
 * usuário só ver "não aconteceu nada" e tentar de novo, em vez de justificar
 * o estado extra de um form controlado.
 */
export async function deleteMyAccount(): Promise<void> {
  const user = await getUser()
  if (!user) return

  // Rate limit: ação irreversível, mas ainda assim protegida contra retry em
  // loop de um bug de cliente.
  const rl = await rateLimit('account-delete', user.id, 3, 60)
  if (!rl.success) return

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    reportError('account.delete', error, { userId: user.id })
    return
  }

  log.info('account.deleted', { userId: user.id })

  // Encerra a sessão do navegador — o usuário deletado não existe mais no
  // Auth, então o cookie da sessão atual ficaria órfão sem isso.
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect('/')
}

import { activateUserAccess } from '@/lib/stripe/activate'
import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/observability/log'

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Onboarding de compra guest, agnóstico ao provedor de pagamento (Stripe,
 * InfinitePay, …). Recebe o e-mail já confirmado pelo pagamento e:
 *   1. resolve a conta pelo e-mail (profiles.email, único) ou cria no Auth;
 *   2. ativa o acesso pago (idempotente);
 *   3. dispara o e-mail de "definir senha" SÓ para conta nova.
 *
 * Só chame após confirmar o pagamento — usa o client admin (service_role).
 * É a MESMA função usada pelo webhook da Stripe e pelo do InfinitePay, para
 * garantir provisionamento idêntico.
 */
export async function onboardGuestByEmail(
  admin: AdminClient,
  email: string,
  opts: { appUrl: string; where: string; stripeCustomerId?: string | null }
): Promise<{ userId: string; isNewUser: boolean }> {
  const { appUrl, where, stripeCustomerId = null } = opts
  const normalized = email.toLowerCase()

  // 1) Achar conta existente. O profiles.email (único, populado pelo trigger
  //    handle_new_user) é a fonte de verdade do id — busca indexada e barata.
  let userId: string | null = null
  let isNewUser = false

  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()
  userId = (existingProfile as { id: string } | null)?.id ?? null

  if (userId) {
    log.info(`${where}.guest_existing_user`, { userId })
  } else {
    // 2) Não há profile → cria o usuário no Auth (email_confirm: true, pois o
    //    pagamento já valida a posse do e-mail). O trigger cria o profile.
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({ email, email_confirm: true })

    if (createErr) {
      // Raro: existe em auth.users mas sem profile (trigger antigo falhou).
      // createUser recusa e-mail duplicado → buscamos o id e seguimos, sem
      // criar outro usuário. Conta já existia → não é nova.
      const fallbackId = await findAuthUserIdByEmail(admin, email)
      if (!fallbackId) throw createErr
      userId = fallbackId
      log.warn(`${where}.guest_recovered_existing`, { userId })
    } else {
      userId = created.user.id
      isNewUser = true
      log.info(`${where}.guest_created_user`, { userId })
    }
  }

  // 3) Ativa o acesso pago (idempotente: não reescreve purchase_date).
  await activateUserAccess(userId, { stripeCustomerId })
  log.info(`${where}.access_activated`, { userId, flow: 'guest' })

  // 4) E-mail de acesso: SÓ para conta nova. Reusa o fluxo de recuperação de
  //    senha do /auth/forgot-password — o link cai no callback e leva o
  //    usuário a definir a senha. Entrega pelo SMTP (Brevo) do Supabase Auth.
  if (isNewUser) {
    const { error: mailErr } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?redirect=/auth/reset-password`,
    })
    if (mailErr) throw mailErr
    log.info(`${where}.guest_access_email_sent`, { userId })
  } else {
    log.info(`${where}.guest_existing_user_reactivated`, { userId })
  }

  return { userId, isNewUser }
}

/**
 * Fallback: encontra o id de um usuário do Auth pelo e-mail paginando
 * listUsers. Só é chamado no caso raro de existir em auth.users sem profile.
 */
async function findAuthUserIdByEmail(
  admin: AdminClient,
  email: string
): Promise<string | null> {
  const target = email.toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === target)
    if (found) return found.id
    if (data.users.length < 200) break // última página
  }
  return null
}

import { randomUUID } from 'crypto'

import { activateUserAccess } from '@/lib/access/activate'
import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/observability/log'

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Onboarding de compra guest, agnóstico ao provedor de pagamento. Recebe o
 * e-mail já confirmado pelo pagamento e:
 *   1. resolve a conta pelo e-mail (profiles.email, único) ou cria no Auth;
 *   2. ativa o acesso pago (idempotente);
 *   3. reclama a conta se ela existir sem e-mail confirmado (ninguém provou
 *      posse do endereço) — rotaciona a senha e trata como conta nova;
 *   4. dispara o e-mail de "definir senha" para conta nova (ou reclamada).
 *
 * Só chame após confirmar o pagamento — usa o client admin (service_role).
 * É a MESMA função usada pelo webhook do InfinitePay e pelo safety net da
 * página de obrigado, para garantir provisionamento idêntico.
 */
export async function onboardGuestByEmail(
  admin: AdminClient,
  email: string,
  opts: { appUrl: string; where: string }
): Promise<{ userId: string; isNewUser: boolean }> {
  const { appUrl, where } = opts
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
  await activateUserAccess(userId)
  log.info(`${where}.access_activated`, { userId, flow: 'guest' })

  // 3.1) Reclaim de conta não verificada. Uma conta pode existir com este
  //      e-mail sem que ninguém tenha provado ser dono dele (o funil do teste
  //      gratuito cria contas só com o e-mail digitado). Nesse caso quem
  //      acabou de pagar é o dono legítimo do endereço: rotacionamos a
  //      credencial — o que já revoga TODAS as sessões ativas do ocupante,
  //      pois o GoTrue faz logout global ao trocar a senha via admin — e
  //      forçamos o e-mail de "definir senha" para o comprador real.
  //      Se a leitura do usuário falhar, tratamos como não verificada
  //      (fail-closed): no pior caso o comprador recebe um e-mail a mais.
  if (!isNewUser) {
    const { data: authUserData, error: authUserErr } =
      await admin.auth.admin.getUserById(userId)
    if (authUserErr) {
      log.warn(`${where}.reclaim_check_failed`, {
        userId,
        error: authUserErr.message,
      })
    }

    if (!authUserData?.user?.email_confirmed_at) {
      const { error: rotateErr } = await admin.auth.admin.updateUserById(
        userId,
        {
          password: `${randomUUID()}-${randomUUID()}`,
          email_confirm: true,
        }
      )
      if (rotateErr) throw rotateErr

      // Passa a tratar como conta nova para que o resetPasswordForEmail abaixo
      // dispare e o comprador real receba o e-mail de "defina sua senha".
      isNewUser = true
      log.warn(`${where}.reclaimed_unverified_account`, { userId })
    }
  }

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

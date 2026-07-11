import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { getStripe } from '@/lib/stripe/server'
import { activateUserAccess } from '@/lib/stripe/activate'
import { createAdminClient } from '@/lib/supabase/admin'
import { log, reportError } from '@/lib/observability/log'

/**
 * Webhook da Stripe (robustez em produção). Verifica a assinatura, deduplica o
 * evento (idempotência) e ativa o acesso em checkout.session.completed.
 * Configure o endpoint no dashboard da Stripe e STRIPE_WEBHOOK_SECRET no env.
 */
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !secret) {
    return NextResponse.json(
      { error: 'Webhook não configurado' },
      { status: 400 }
    )
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    reportError('stripe.webhook.verify', err)
    const msg = err instanceof Error ? err.message : 'assinatura inválida'
    return NextResponse.json({ error: `Webhook: ${msg}` }, { status: 400 })
  }

  const admin = createAdminClient()

  // Idempotência: registra o event.id antes de processar. Se já existe (chave
  // primária), foi processado numa reentrega anterior → ignora.
  const { error: dedupeErr } = await admin
    .from('stripe_events')
    .insert({ id: event.id, type: event.type })
  if (dedupeErr) {
    if (dedupeErr.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    reportError('stripe.webhook.dedupe', dedupeErr, { eventId: event.id })
    // Sem conseguir registrar, devolve 500 para a Stripe reentregar depois.
    return NextResponse.json({ error: 'dedupe_failed' }, { status: 500 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const stripeCustomerId =
        typeof session.customer === 'string' ? session.customer : null

      const userId = session.metadata?.user_id
      if (userId) {
        // Fluxo com conta: user_id veio do checkout autenticado.
        await activateUserAccess(userId, { stripeCustomerId })
        log.info('stripe.webhook.access_activated', { userId })
      } else {
        // Fluxo guest: sem user_id, resolvemos a conta pelo e-mail do pagamento.
        await handleGuestCheckout(
          request,
          admin,
          session,
          stripeCustomerId,
          event.id
        )
      }
    }
  } catch (err) {
    // Falhou ao processar: remove o registro para permitir reprocessar na
    // próxima reentrega da Stripe, e devolve 500.
    await admin.from('stripe_events').delete().eq('id', event.id)
    reportError('stripe.webhook.process', err, { eventId: event.id })
    return NextResponse.json({ error: 'process_failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Base para os links do e-mail. Mesma lógica do checkout: preferimos o host
 * real da requisição (proxy da Vercel) e caímos no env/origin como fallback.
 */
function resolveAppUrl(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  return forwardedHost && !forwardedHost.includes('localhost')
    ? `${forwardedProto}://${forwardedHost}`
    : process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
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

/**
 * Checkout de visitante (sem conta prévia): resolve ou cria a conta pelo
 * e-mail do pagamento e ativa o acesso. Só dispara o e-mail de "definir senha"
 * quando a conta é NOVA (criada agora) — contas existentes só são reativadas.
 */
async function handleGuestCheckout(
  request: Request,
  admin: AdminClient,
  session: Stripe.Checkout.Session,
  stripeCustomerId: string | null,
  eventId: string
): Promise<void> {
  const email = session.customer_details?.email ?? session.customer_email
  if (!email) {
    // Sem e-mail não há como associar a conta. Reentregar não resolve, então
    // reconhecemos o evento (received:true) para não entrar em loop de retry.
    log.warn('stripe.webhook.guest_missing_email', { eventId })
    return
  }

  // 1) Achar conta existente. O profiles.email (único, populado pelo trigger
  //    handle_new_user) é a fonte de verdade do id — busca indexada e barata.
  let userId: string | null = null
  let isNewUser = false
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  userId = (existingProfile as { id: string } | null)?.id ?? null

  if (userId) {
    log.info('stripe.webhook.guest_existing_user', { eventId, userId })
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
      log.warn('stripe.webhook.guest_recovered_existing', { eventId, userId })
    } else {
      userId = created.user.id
      isNewUser = true
      log.info('stripe.webhook.guest_created_user', { eventId, userId })
    }
  }

  // 3) Ativa o acesso pago (idempotente: não reescreve purchase_date).
  await activateUserAccess(userId, { stripeCustomerId })
  log.info('stripe.webhook.access_activated', { userId, flow: 'guest' })

  // 4) E-mail de acesso: SÓ para conta nova. Reusa o fluxo de recuperação de
  //    senha do /auth/forgot-password — o link cai no callback e leva o
  //    usuário a definir a senha. Entrega pelo SMTP (Brevo) do Supabase Auth.
  //    Conta já existente é apenas reativada, sem e-mail.
  if (isNewUser) {
    const appUrl = resolveAppUrl(request)
    const { error: mailErr } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?redirect=/auth/reset-password`,
    })
    if (mailErr) throw mailErr
    log.info('stripe.webhook.guest_access_email_sent', { eventId, userId })
  } else {
    log.info('stripe.webhook.guest_existing_user_reactivated', {
      eventId,
      userId,
    })
  }
}

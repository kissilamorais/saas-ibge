import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { getStripe } from '@/lib/stripe/server'
import { activateUserAccess } from '@/lib/stripe/activate'
import { onboardGuestByEmail } from '@/lib/onboarding/guest'
import { createAdminClient } from '@/lib/supabase/admin'
import { log, reportError } from '@/lib/observability/log'

/**
 * Webhook da Stripe (robustez em produção). Verifica a assinatura, deduplica o
 * evento (idempotência) e processa:
 *   - checkout.session.completed → ativa o acesso (+ fecha o abandono, se houver)
 *   - checkout.session.expired   → registra o checkout abandonado
 *
 * Configure o endpoint no dashboard da Stripe e STRIPE_WEBHOOK_SECRET no env.
 * O endpoint precisa estar inscrito NOS DOIS eventos — `expired` não vem por
 * padrão em endpoints criados antes desta feature.
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

      // Fecha o ciclo de recuperação (métrica). Nunca lança: falha aqui é de
      // rastreamento e não pode impedir a liberação do acesso já pago.
      await markAbandonedCheckoutRecovered(admin, session, event.id)
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      await recordAbandonedCheckout(admin, session, event.id)
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
 * Checkout de visitante (sem conta prévia): resolve ou cria a conta pelo
 * e-mail do pagamento e ativa o acesso, delegando ao onboarding compartilhado
 * (o MESMO usado pelo webhook do InfinitePay).
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

  await onboardGuestByEmail(admin, email, {
    appUrl: resolveAppUrl(request),
    where: 'stripe.webhook',
    stripeCustomerId,
  })
}

/** E-mail do comprador/visitante numa sessão, na ordem de confiabilidade. */
function sessionEmail(session: Stripe.Checkout.Session): string | null {
  return session.customer_details?.email ?? session.customer_email ?? null
}

/**
 * Checkout abandonado: a sessão atingiu `expires_at` sem pagamento. Grava a
 * linha em abandoned_checkouts para o admin acompanhar e disparar o contato
 * MANUALMENTE (não há envio automático de e-mail nesta fase).
 *
 * Guards, em ordem — qualquer um retorna cedo:
 *   1. sem e-mail → não há como contatar;
 *   2. payment_status 'paid' → não é abandono de verdade;
 *   3. e-mail já é de cliente pagante → não faz sentido recuperar.
 *
 * Idempotência em duas camadas: o insert em stripe_events (topo do handler)
 * barra reentrega do MESMO evento; o unique em session_id barra gravar a
 * mesma sessão duas vezes por qualquer outro caminho.
 */
async function recordAbandonedCheckout(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<void> {
  const email = sessionEmail(session)
  if (!email) {
    log.info('stripe.webhook.abandoned_skipped', {
      eventId,
      reason: 'no_email',
    })
    return
  }

  if (session.payment_status === 'paid') {
    log.info('stripe.webhook.abandoned_skipped', { eventId, reason: 'paid' })
    return
  }

  const { data: payer } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .not('purchase_date', 'is', null)
    .maybeSingle()
  if (payer) {
    log.info('stripe.webhook.abandoned_skipped', {
      eventId,
      reason: 'already_customer',
    })
    return
  }

  // `consent.promotions` é null sempre que a Stripe não exibiu a caixa — o que
  // inclui todo o público BR (o recurso é restrito a empresa+cliente nos EUA).
  // Guardamos como null, que significa "não coletado", nunca "recusado".
  const consent = session.consent?.promotions ?? null
  const recovery = session.after_expiration?.recovery ?? null

  const { error } = await admin.from('abandoned_checkouts').insert({
    session_id: session.id,
    email: email.toLowerCase(),
    full_name: session.customer_details?.name ?? null,
    recovery_url: recovery?.url ?? null,
    recovery_expires_at: recovery?.expires_at
      ? new Date(recovery.expires_at * 1000).toISOString()
      : null,
    consent_status: consent,
    amount_cents: session.amount_total,
    currency: session.currency ?? 'brl',
    expired_at: new Date((session.expires_at ?? Date.now() / 1000) * 1000).toISOString(),
  })

  if (error) {
    // 23505 = sessão já registrada. Reentregar não muda nada → reconhece.
    if (error.code === '23505') {
      log.info('stripe.webhook.abandoned_duplicate', {
        eventId,
        sessionId: session.id,
      })
      return
    }
    throw error
  }

  log.info('stripe.webhook.abandoned_recorded', {
    eventId,
    sessionId: session.id,
    hasRecoveryUrl: !!recovery?.url,
  })
}

/**
 * Compra concluída: fecha o abandono correspondente marcando `recovered_at`,
 * para medir a taxa de recuperação.
 *
 * Casamos primeiro por `recovered_from` — a Stripe preenche esse campo na
 * sessão criada a partir da recovery URL, apontando para a sessão expirada
 * original. É o vínculo exato. Sem ele (a pessoa voltou pelo site em vez do
 * link), caímos no e-mail: fecha o abandono pendente mais recente.
 *
 * Nunca lança: isto é métrica, e falhar aqui não pode derrubar o webhook e
 * bloquear o acesso de quem já pagou.
 */
async function markAbandonedCheckoutRecovered(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<void> {
  try {
    const now = new Date().toISOString()

    if (session.recovered_from) {
      const { data } = await admin
        .from('abandoned_checkouts')
        .update({ recovered_at: now })
        .eq('session_id', session.recovered_from)
        .is('recovered_at', null)
        .select('id')
      if (data && data.length > 0) {
        log.info('stripe.webhook.abandoned_recovered', {
          eventId,
          via: 'recovered_from',
          sessionId: session.recovered_from,
        })
        return
      }
    }

    const email = sessionEmail(session)
    if (!email) return

    // Sem o vínculo direto: fecha o abandono pendente mais recente do e-mail.
    // Um por compra — não marcamos abandonos antigos em massa.
    const { data: pending } = await admin
      .from('abandoned_checkouts')
      .select('id')
      .eq('email', email.toLowerCase())
      .is('recovered_at', null)
      .order('expired_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const pendingId = (pending as { id: string } | null)?.id
    if (!pendingId) return

    await admin
      .from('abandoned_checkouts')
      .update({ recovered_at: now })
      .eq('id', pendingId)

    log.info('stripe.webhook.abandoned_recovered', { eventId, via: 'email' })
  } catch (err) {
    reportError('stripe.webhook.abandoned_recover_mark', err, { eventId })
  }
}

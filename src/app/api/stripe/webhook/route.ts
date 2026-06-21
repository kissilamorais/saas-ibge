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
      const userId = session.metadata?.user_id
      if (userId) {
        await activateUserAccess(userId, {
          stripeCustomerId:
            typeof session.customer === 'string' ? session.customer : null,
        })
        log.info('stripe.webhook.access_activated', { userId })
      } else {
        log.warn('stripe.webhook.missing_user_id', { eventId: event.id })
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

import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { getStripe } from '@/lib/stripe/server'
import { activateUserAccess } from '@/lib/stripe/activate'

/**
 * Webhook da Stripe (robustez em produção). Verifica a assinatura e ativa
 * o acesso no evento checkout.session.completed.
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
    const msg = err instanceof Error ? err.message : 'assinatura inválida'
    return NextResponse.json({ error: `Webhook: ${msg}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    if (userId) {
      await activateUserAccess(userId, {
        stripeCustomerId:
          typeof session.customer === 'string' ? session.customer : null,
      })
    }
  }

  return NextResponse.json({ received: true })
}

import { NextResponse } from 'next/server'

import { getStripe } from '@/lib/stripe/server'
import { activateUserAccess } from '@/lib/stripe/activate'
import { reportError } from '@/lib/observability/log'

/**
 * Stripe redireciona para cá após o checkout. Confirmamos o pagamento
 * direto na API da Stripe (fonte confiável) e ativamos o acesso.
 * Funciona mesmo sem webhook configurado.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(`${origin}/checkout`)
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    const userId = session.metadata?.user_id

    if (session.payment_status === 'paid' && userId) {
      await activateUserAccess(userId, {
        stripeCustomerId:
          typeof session.customer === 'string' ? session.customer : null,
      })
      return NextResponse.redirect(`${origin}/dashboard?welcome=1`)
    }
  } catch (err) {
    reportError('stripe.checkout.success', err, { sessionId })
    // cai no fallback abaixo
  }

  return NextResponse.redirect(`${origin}/checkout?canceled=1`)
}

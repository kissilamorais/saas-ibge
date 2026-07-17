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

    if (session.payment_status === 'paid') {
      if (userId) {
        // Fluxo autenticado: já temos conta e sessão → ativa e leva ao
        // dashboard, disparando o Purchase via `welcome=1`.
        await activateUserAccess(userId, {
          stripeCustomerId:
            typeof session.customer === 'string' ? session.customer : null,
        })
        return NextResponse.redirect(`${origin}/dashboard?welcome=1`)
      }

      // Fluxo guest: sem conta/sessão ainda. A criação da conta e o e-mail de
      // "definir senha" ficam a cargo do webhook. Aqui só confirmamos o
      // pagamento e mandamos para a página de obrigado, que dispara o Purchase
      // (pagamento já confirmado server-side na Stripe → conversão real).
      return NextResponse.redirect(
        `${origin}/checkout/obrigado?session_id=${sessionId}`
      )
    }
  } catch (err) {
    reportError('stripe.checkout.success', err, { sessionId })
    // cai no fallback abaixo
  }

  return NextResponse.redirect(`${origin}/checkout?canceled=1`)
}

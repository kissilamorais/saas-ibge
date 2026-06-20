import { NextResponse } from 'next/server'

import {
  COURSE_CURRENCY,
  COURSE_NAME,
  COURSE_PRICE_CENTS,
  getStripe,
} from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Já tem acesso? Não cria nova cobrança.
  const { data: profileData } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .maybeSingle()
  const profile = profileData as { subscription_status: string | null } | null

  if (profile?.subscription_status === 'active') {
    return NextResponse.json({ error: 'Você já tem acesso.' }, { status: 400 })
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: COURSE_CURRENCY,
          unit_amount: COURSE_PRICE_CENTS,
          product_data: { name: COURSE_NAME },
        },
      },
    ],
    metadata: { user_id: user.id },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout?canceled=1`,
  })

  return NextResponse.json({ url: session.url })
}

import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { reportError } from '@/lib/observability/log'
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

  // Visitante sem conta pode pagar direto (checkout guest). Só rodamos o
  // bloqueio de "já tem acesso" quando há usuário logado.
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .maybeSingle()
    const profile = profileData as { subscription_status: string | null } | null

    if (profile?.subscription_status === 'active') {
      return NextResponse.json({ error: 'Você já tem acesso.' }, { status: 400 })
    }
  }

  // Base para success/cancel URLs. Preferimos o host real da requisição
  // (via headers de proxy da Vercel) para não depender de NEXT_PUBLIC_APP_URL
  // estar correta em produção — se ela apontar pra localhost, o redirect
  // pós-pagamento quebra. Só caímos no env/origin como último recurso.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const appUrl =
    forwardedHost && !forwardedHost.includes('localhost')
      ? `${forwardedProto}://${forwardedHost}`
      : process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  try {
    // Logado: prende o e-mail e amarra o user_id p/ o webhook ativar direto.
    // Guest: deixa o Stripe coletar o e-mail e marca flow=guest — o webhook
    // cuida da criação/ativação da conta a partir do e-mail informado.
    const identity: Pick<
      Stripe.Checkout.SessionCreateParams,
      'customer_email' | 'metadata'
    > = user
      ? { customer_email: user.email, metadata: { user_id: user.id } }
      : { metadata: { flow: 'guest' } }

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      ...identity,
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
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout?canceled=1`,
      // Recuperação de checkout abandonado: quando a sessão expira sem
      // pagamento, a Stripe dispara checkout.session.expired com uma
      // recovery.url anexada. Abrir essa URL cria uma nova sessão, cópia
      // desta. O webhook grava o abandono em abandoned_checkouts e o admin
      // dispara o contato manualmente (ver /admin/abandonos).
      after_expiration: {
        recovery: { enabled: true, allow_promotion_codes: true },
      },
      // Consentimento para e-mail promocional. Atenção: a Stripe só exibe a
      // caixa quando a empresa E o cliente estão nos EUA. Sendo a Aprovus BR
      // com clientes BR, isto é hoje um no-op e session.consent.promotions
      // chega sempre null — que significa "não coletado", NÃO "recusado".
      // Fica declarado para ativar sozinho caso um dia vendamos pros EUA.
      consent_collection: { promotions: 'auto' },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    reportError('stripe.checkout.create', error)
    return NextResponse.json(
      { error: 'Não foi possível iniciar o pagamento. Tente novamente.' },
      { status: 500 },
    )
  }
}

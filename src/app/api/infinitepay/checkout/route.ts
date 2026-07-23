import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'

import { reportError } from '@/lib/observability/log'
import { createInfinitePayLink, COURSE_PRICE_CENTS } from '@/lib/infinitepay/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Logado que já tem acesso não paga de novo (mesmo guard do checkout Stripe).
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

  // Base para redirect/webhook. Preferimos o host real da requisição (proxy da
  // Vercel) para não depender de NEXT_PUBLIC_APP_URL estar correta em produção.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const appUrl =
    forwardedHost && !forwardedHost.includes('localhost')
      ? `${forwardedProto}://${forwardedHost}`
      : process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  // order_nsu: identificador único do pedido (UUID). Amarra o pending_order ao
  // link do InfinitePay e volta no webhook/redirect para reconciliação.
  const orderNsu = randomUUID()
  // Guest anônimo não tem e-mail ainda; logado amarramos pelo e-mail da conta.
  const customerEmail = user?.email ?? null

  try {
    // 1) Registra o pedido pendente ANTES de criar o link — assim o webhook
    //    sempre encontra a linha, mesmo que a resposta do /links se perca.
    const admin = createAdminClient()
    const { error: insertErr } = await admin.from('pending_orders').insert({
      order_nsu: orderNsu,
      amount: COURSE_PRICE_CENTS,
      status: 'pending',
      customer_email: customerEmail,
    })
    if (insertErr) throw insertErr

    // 2) Cria o link de pagamento hospedado no InfinitePay.
    const url = await createInfinitePayLink({
      orderNsu,
      redirectUrl: `${appUrl}/checkout/obrigado`,
      webhookUrl: `${appUrl}/api/infinitepay/webhook`,
      customerEmail,
    })

    return NextResponse.json({ url })
  } catch (error) {
    reportError('infinitepay.checkout.create', error, { orderNsu })
    return NextResponse.json(
      { error: 'Não foi possível iniciar o pagamento. Tente novamente.' },
      { status: 500 },
    )
  }
}

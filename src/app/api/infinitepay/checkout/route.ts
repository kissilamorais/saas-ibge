import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'

import { reportError } from '@/lib/observability/log'
import { createInfinitePayLink, COURSE_PRICE_CENTS } from '@/lib/infinitepay/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Formato de e-mail simples (obrigatório no fluxo guest). Espelha a validação
// do CheckoutButton — o cliente valida por UX, o servidor por segurança.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  // E-mail do comprador. Logado: o da sessão (fonte confiável; ignora o body,
  // para não deixar amarrar o pedido a um e-mail alheio). Guest: obrigatório e
  // validado — sem ele o webhook não teria como criar a conta após o pagamento.
  let customerEmail: string
  if (user?.email) {
    customerEmail = user.email.toLowerCase().trim()
  } else {
    const body = (await request.json().catch(() => null)) as
      | { email?: unknown }
      | null
    const rawEmail = typeof body?.email === 'string' ? body.email : ''
    customerEmail = rawEmail.toLowerCase().trim()
    if (!EMAIL_RE.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Informe um e-mail válido para receber seu acesso.' },
        { status: 400 },
      )
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

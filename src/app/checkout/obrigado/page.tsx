import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import type { Metadata } from 'next'
import { CheckCircle2, Mail } from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'
import { GuestPurchaseTracker } from '@/components/analytics/GuestPurchaseTracker'
import { sendMetaPurchaseEvent } from '@/lib/analytics/meta-capi'
import { checkInfinitePayPayment } from '@/lib/infinitepay/server'
import { onboardGuestByEmail } from '@/lib/onboarding/guest'
import { createAdminClient } from '@/lib/supabase/admin'
import { log, reportError } from '@/lib/observability/log'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Pagamento confirmado — Aprovus',
  robots: { index: false, follow: false },
}

// Faz escrita (rede de segurança do pagamento) → nunca deve ser cacheada.
export const dynamic = 'force-dynamic'

/**
 * Página de obrigado do fluxo guest. Chegamos aqui pelo redirect do provedor
 * após o pagamento.
 *
 * InfinitePay volta com `order_nsu`, `transaction_nsu`, `slug` e
 * `capture_method`. Como o webhook pode atrasar, aqui roda a REDE DE SEGURANÇA:
 * consulta o `payment_check` e, se confirmado pago, reivindica o pedido e
 * dispara o MESMO onboarding do webhook. É idempotente com o webhook.
 *
 * (O fluxo Stripe legado, quando ativo, chega com `session_id` já verificado
 * pela success route — mantido por compatibilidade.)
 */
export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: {
    session_id?: string
    order_nsu?: string
    transaction_nsu?: string
    slug?: string
    capture_method?: string
  }
}) {
  const { session_id, order_nsu, transaction_nsu, slug } = searchParams

  let confirmedPaid = Boolean(session_id) // Stripe: já verificado upstream.
  let buyerEmail: string | null = null
  if (order_nsu) {
    const result = await infinitePaySafetyNet({
      orderNsu: order_nsu,
      transactionNsu: transaction_nsu,
      slug,
      appUrl: resolveAppUrl(),
    })
    confirmedPaid = result.paid
    buyerEmail = result.email
  }

  // Purchase server-side (Conversions API) com os sinais REAIS do browser
  // (cookies _fbp/_fbc, IP, user-agent) — o disparo de melhor qualidade. Roda
  // no servidor, então é imune a ad-blocker. Dedup com o pixel do browser e com
  // o webhook via event_id=order_nsu; refresh reusa o mesmo id → não reconta.
  if (confirmedPaid && order_nsu && buyerEmail) {
    const c = cookies()
    const h = headers()
    sendMetaPurchaseEvent({
      email: buyerEmail,
      orderId: order_nsu,
      eventSourceUrl: resolveAppUrl(),
      clientIpAddress: h.get('x-forwarded-for'),
      clientUserAgent: h.get('user-agent'),
      fbp: c.get('_fbp')?.value ?? null,
      fbc: c.get('_fbc')?.value ?? null,
    })
  }

  // Dispara o Purchase do pixel só quando o pagamento está confirmado.
  const trackerId = order_nsu || session_id

  return (
    <AuthShell>
      {confirmedPaid && <GuestPurchaseTracker sessionId={trackerId} />}
      <div className="flex w-full flex-col items-center">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl font-semibold">
            Pagamento confirmado! ✅
          </CardTitle>
          <CardDescription>
            Seu acesso ao Aprovus está garantido.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>
              Enviamos um e-mail para você{' '}
              <strong className="font-semibold">definir sua senha</strong> e
              acessar o Aprovus. Confira sua caixa de entrada (e o{' '}
              <strong className="font-semibold">spam</strong>).
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Já definiu sua senha?{' '}
            <Link href="/auth/login" className="underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>

        <p className="mt-6 max-w-md text-center text-sm text-muted-foreground">
          Algum problema com seu acesso? Fale com a gente:{' '}
          <a
            href="mailto:getvellum@gmail.com"
            className="font-medium text-primary underline underline-offset-2"
          >
            getvellum@gmail.com
          </a>
        </p>
      </div>
    </AuthShell>
  )
}

/**
 * Rede de segurança para o InfinitePay: confirma o pagamento diretamente na
 * API caso o webhook não tenha chegado. Idempotente com o webhook (reivindica
 * o pedido via status='pending' → só um vencedor). Nunca lança: a página
 * precisa renderizar de qualquer forma. Retorna se o pagamento está pago e o
 * e-mail do comprador (para o Purchase server-side).
 */
async function infinitePaySafetyNet({
  orderNsu,
  transactionNsu,
  slug,
  appUrl,
}: {
  orderNsu: string
  transactionNsu?: string
  slug?: string
  appUrl: string
}): Promise<{ paid: boolean; email: string | null }> {
  try {
    const admin = createAdminClient()

    const { data } = await admin
      .from('pending_orders')
      .select('status, customer_email')
      .eq('order_nsu', orderNsu)
      .maybeSingle()
    const order = data as {
      status: string
      customer_email: string | null
    } | null

    if (!order) return { paid: false, email: null }
    if (order.status === 'paid') {
      return { paid: true, email: order.customer_email } // webhook já processou.
    }

    // Ainda pendente → confirma com o InfinitePay antes de liberar.
    if (!transactionNsu || !slug) return { paid: false, email: null }
    const check = await checkInfinitePayPayment({
      orderNsu,
      transactionNsu,
      slug,
    })
    if (check.paid !== true) return { paid: false, email: null }

    // Pago, mas o webhook atrasou: reivindica e faz o onboarding aqui.
    const { data: claimed } = await admin
      .from('pending_orders')
      .update({ status: 'paid' })
      .eq('order_nsu', orderNsu)
      .eq('status', 'pending')
      .select('order_nsu')

    if (claimed && claimed.length > 0) {
      log.info('infinitepay.safetynet.claimed', { orderNsu })
      if (order.customer_email) {
        await onboardGuestByEmail(admin, order.customer_email, {
          appUrl,
          where: 'infinitepay.safetynet',
        })
      } else {
        // Mesmo evento que perde dinheiro do webhook: registra alto p/ alertar.
        reportError(
          'infinitepay.safetynet.paid_missing_email',
          new Error('pending_orders.customer_email ausente'),
          { orderNsu },
        )
      }
    }
    return { paid: true, email: order.customer_email }
  } catch (err) {
    reportError('infinitepay.obrigado.safetynet', err, { orderNsu })
    return { paid: false, email: null }
  }
}

/** Base para os links do e-mail, a partir dos headers da requisição. */
function resolveAppUrl(): string {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return host && !host.includes('localhost')
    ? `${proto}://${host}`
    : process.env.NEXT_PUBLIC_APP_URL || ''
}

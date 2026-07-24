import { NextResponse } from 'next/server'

import { onboardGuestByEmail } from '@/lib/onboarding/guest'
import { checkInfinitePayPayment } from '@/lib/infinitepay/server'
import { sendMetaPurchaseEvent } from '@/lib/analytics/meta-capi'
import { createAdminClient } from '@/lib/supabase/admin'
import { log, reportError } from '@/lib/observability/log'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * Webhook do InfinitePay: pagamento aprovado. O InfinitePay NÃO assina o
 * payload, então "recebi um POST" NÃO é prova de pagamento — antes de liberar
 * qualquer acesso confirmamos o pagamento direto na API (payment_check), usando
 * `transaction_nsu` + `invoice_slug` que vêm no próprio payload. Isso fecha a
 * porta de acesso grátis via webhook forjado.
 *
 *   - `order_nsu` deve existir em pending_orders (emitido por nós) — id
 *     desconhecido é no-op;
 *   - confirmação forte: payment_check tem que devolver `paid === true`;
 *   - o e-mail vem SÓ de pending_orders.customer_email (gravado no checkout).
 *     Sem e-mail não provisionamos: erro crítico, pedido segue pending;
 *   - idempotência: claim atômico `status: pending -> paid` (1 vencedor).
 */
export async function POST(request: Request) {
  // Rate limit por IP: 30/min (folgado — o InfinitePay pode reenviar). 429 faz
  // o InfinitePay tentar de novo mais tarde, sem perder o pagamento.
  const rl = await rateLimit('infinitepay-webhook', clientIp(request), 30, 60)
  if (!rl.success) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch (err) {
    reportError('infinitepay.webhook.parse', err)
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const orderNsu = typeof payload.order_nsu === 'string' ? payload.order_nsu : null
  if (!orderNsu) {
    log.warn('infinitepay.webhook.missing_order_nsu')
    // Sem order_nsu não há o que fazer; 200 para não gerar retry infinito.
    return NextResponse.json({ received: true, skipped: 'no_order_nsu' })
  }

  const transactionNsu =
    typeof payload.transaction_nsu === 'string' ? payload.transaction_nsu : null
  const slug =
    typeof payload.invoice_slug === 'string' ? payload.invoice_slug : null

  const admin = createAdminClient()

  try {
    const { data: orderData, error: findErr } = await admin
      .from('pending_orders')
      .select('order_nsu, status, customer_email')
      .eq('order_nsu', orderNsu)
      .maybeSingle()
    if (findErr) throw findErr

    const order = orderData as {
      order_nsu: string
      status: string
      customer_email: string | null
    } | null

    if (!order) {
      // Pedido não emitido por nós (ou já expirado do banco). No-op seguro.
      log.warn('infinitepay.webhook.unknown_order', { orderNsu })
      return NextResponse.json({ received: true, skipped: 'unknown_order' })
    }

    if (order.status === 'paid') {
      // Reentrega de um pedido já processado → idempotente.
      return NextResponse.json({ received: true, duplicate: true })
    }

    // O e-mail é obrigatório e vem só do NOSSO pedido. Sem ele não há como
    // provisionar — erro crítico (não silencioso), pedido segue pending.
    const email = order.customer_email
    if (!email) {
      reportError(
        'infinitepay.webhook.paid_missing_email',
        new Error('pending_orders.customer_email ausente'),
        { orderNsu },
      )
      return NextResponse.json({ error: 'missing_email' }, { status: 500 })
    }

    // Confirmação forte do pagamento ANTES de reivindicar/provisionar. Sem os
    // dados para consultar, ou se não estiver pago, não liberamos nada.
    if (!transactionNsu || !slug) {
      reportError(
        'infinitepay.webhook.unverifiable',
        new Error('transaction_nsu/invoice_slug ausentes no payload'),
        { orderNsu },
      )
      return NextResponse.json({ error: 'unverifiable' }, { status: 400 })
    }
    const check = await checkInfinitePayPayment({ orderNsu, transactionNsu, slug })
    if (check.paid !== true) {
      // Webhook sem pagamento real confirmado (possível forja). Não provisiona;
      // 200 para não entrar em loop de retry, mas registra alto para alertar.
      reportError(
        'infinitepay.webhook.payment_not_confirmed',
        new Error('payment_check não retornou paid=true'),
        { orderNsu },
      )
      return NextResponse.json({ received: true, skipped: 'not_paid' })
    }

    // Pagamento confirmado. Marca pago antes do onboarding: barra
    // reprocessamento em reentregas concorrentes (status='pending' → 1 vencedor).
    const { data: claimed, error: updErr } = await admin
      .from('pending_orders')
      .update({ status: 'paid' })
      .eq('order_nsu', orderNsu)
      .eq('status', 'pending')
      .select('order_nsu')
    if (updErr) throw updErr
    if (!claimed || claimed.length === 0) {
      // Outra reentrega já reivindicou → idempotente.
      return NextResponse.json({ received: true, duplicate: true })
    }

    await onboardGuestByEmail(admin, email, {
      appUrl: resolveAppUrl(request),
      where: 'infinitepay.webhook',
    })

    // Purchase server-side (Conversions API). Fire-and-forget: não bloqueia o
    // 200 pro InfinitePay. Dedup com o pixel do browser via event_id=order_nsu.
    // Obs.: aqui o request é server-to-server do InfinitePay, então IP/UA/fbp
    // não são do comprador — o match forte vem do e-mail hasheado. O disparo
    // com os sinais do browser acontece na /checkout/obrigado.
    sendMetaPurchaseEvent({
      email,
      orderId: orderNsu,
      eventSourceUrl: resolveAppUrl(request),
      fbp: readCookie(request.headers.get('cookie'), '_fbp'),
      fbc: readCookie(request.headers.get('cookie'), '_fbc'),
    })

    log.info('infinitepay.webhook.processed', { orderNsu })
    return NextResponse.json({ received: true })
  } catch (err) {
    // Falhou o onboarding: reabre o pedido para reprocessar na reentrega.
    await admin
      .from('pending_orders')
      .update({ status: 'pending' })
      .eq('order_nsu', orderNsu)
      .eq('status', 'paid')
    reportError('infinitepay.webhook.process', err, { orderNsu })
    return NextResponse.json({ error: 'process_failed' }, { status: 500 })
  }
}

/** Lê um cookie do header `Cookie` (raw). Retorna null se ausente. */
function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('=')) || null
  }
  return null
}

/** Base para os links do e-mail. Mesma lógica do checkout/webhook Stripe. */
function resolveAppUrl(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  return forwardedHost && !forwardedHost.includes('localhost')
    ? `${forwardedProto}://${forwardedHost}`
    : process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}

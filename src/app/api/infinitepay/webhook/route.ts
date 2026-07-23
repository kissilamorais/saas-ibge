import { NextResponse } from 'next/server'

import { onboardGuestByEmail } from '@/lib/onboarding/guest'
import { createAdminClient } from '@/lib/supabase/admin'
import { log, reportError } from '@/lib/observability/log'

/**
 * Webhook do InfinitePay: pagamento aprovado. O InfinitePay NÃO assina o
 * payload nem devolve o e-mail do comprador, então:
 *   - confiamos apenas em `order_nsu` que NÓS emitimos (existe em
 *     pending_orders) — um id desconhecido é no-op;
 *   - idempotência: se o pedido já está `paid`, devolve 200 sem reprocessar;
 *   - o e-mail vem de pending_orders.customer_email (gravado no checkout);
 *     como fallback, tentamos qualquer campo de e-mail do payload.
 *
 * Responde 200 rápido (< 1s): faz só o trabalho essencial de DB + onboarding.
 * A confirmação forte (payment_check) é a rede de segurança da /checkout/obrigado.
 */
export async function POST(request: Request) {
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

    // Marca pago antes do onboarding: barra reprocessamento em reentregas
    // concorrentes (a condição status='pending' garante 1 vencedor).
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

    // Resolve o e-mail: pending_orders primeiro, payload como fallback.
    const email = order.customer_email ?? emailFromPayload(payload)
    if (!email) {
      // Pago, mas sem e-mail não há como provisionar a conta. Fica registrado
      // como paid; o acesso pode ser liberado manualmente (admin) depois.
      log.warn('infinitepay.webhook.paid_missing_email', { orderNsu })
      return NextResponse.json({ received: true, warning: 'missing_email' })
    }

    await onboardGuestByEmail(admin, email, {
      appUrl: resolveAppUrl(request),
      where: 'infinitepay.webhook',
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

/** Tenta extrair um e-mail do payload do InfinitePay (formato não garantido). */
function emailFromPayload(payload: Record<string, unknown>): string | null {
  const customer = payload.customer as { email?: unknown } | undefined
  const candidates = [customer?.email, payload.email, payload.customer_email]
  for (const c of candidates) {
    if (typeof c === 'string' && c.includes('@')) return c
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

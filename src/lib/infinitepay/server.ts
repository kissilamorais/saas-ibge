import { COURSE_NAME, COURSE_PRICE_CENTS } from '@/lib/stripe/server'

/**
 * Cliente mínimo da API de Checkout do InfinitePay. Os endpoints públicos
 * (/links, /payment_check) são amarrados ao handle da conta — não exigem
 * chave secreta. O handle é configurável por env (default: grupovellum).
 */
export const INFINITEPAY_API_BASE = 'https://api.checkout.infinitepay.io'
export const INFINITEPAY_HANDLE =
  process.env.INFINITEPAY_HANDLE || 'grupovellum'

// Teto de espera por chamada. Sem isso, um InfinitePay lento segura a função
// da Vercel até o timeout dela — no checkout, deixa o comprador no spinner.
const INFINITEPAY_TIMEOUT_MS = 8000

// Preço/descrição vêm da mesma fonte do Stripe para não divergir.
export { COURSE_NAME, COURSE_PRICE_CENTS }

/**
 * `fetch` com timeout duro (AbortController). Em estouro, lança um erro
 * DESCRITIVO ("InfinitePay timeout após 8s") — o catch das rotas de
 * checkout/webhook trata e vira 500/erro amigável, sem pendurar a requisição.
 */
async function fetchInfinitePay(
  url: string,
  init: RequestInit
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), INFINITEPAY_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('InfinitePay timeout após 8s')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

interface CreateLinkParams {
  orderNsu: string
  redirectUrl: string
  webhookUrl: string
  customerEmail?: string | null
}

/**
 * Cria um link de pagamento no InfinitePay e devolve a URL do checkout
 * hospedado. `items` (sem "e" — grafia da API) leva 1 item de R$97 em centavos.
 * Lança se a API responder com erro ou sem URL.
 */
export async function createInfinitePayLink({
  orderNsu,
  redirectUrl,
  webhookUrl,
  customerEmail,
}: CreateLinkParams): Promise<string> {
  const body: Record<string, unknown> = {
    handle: INFINITEPAY_HANDLE,
    order_nsu: orderNsu,
    redirect_url: redirectUrl,
    webhook_url: webhookUrl,
    items: [
      {
        quantity: 1,
        price: COURSE_PRICE_CENTS,
        description: COURSE_NAME,
      },
    ],
  }
  if (customerEmail) {
    body.customer = { email: customerEmail }
  }

  const res = await fetchInfinitePay(`${INFINITEPAY_API_BASE}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => null)) as
    | { url?: string; link?: string; [k: string]: unknown }
    | null

  if (!res.ok) {
    throw new Error(
      `InfinitePay /links ${res.status}: ${JSON.stringify(data)}`
    )
  }

  // A URL do link vem em `url` (fallback defensivo p/ `link`, caso a API varie).
  const url = data?.url ?? data?.link
  if (!url || typeof url !== 'string') {
    throw new Error(
      `InfinitePay /links sem URL no retorno: ${JSON.stringify(data)}`
    )
  }
  return url
}

export interface PaymentCheckParams {
  orderNsu: string
  transactionNsu: string
  slug: string
}

export interface PaymentCheckResult {
  success?: boolean
  paid?: boolean
  amount?: number
  paid_amount?: number
  installments?: number
  capture_method?: string
}

/**
 * Rede de segurança: consulta o status de um pagamento diretamente no
 * InfinitePay (usado quando o webhook atrasa/falha). Devolve o corpo cru;
 * `paid === true` significa pago e confirmado.
 */
export async function checkInfinitePayPayment({
  orderNsu,
  transactionNsu,
  slug,
}: PaymentCheckParams): Promise<PaymentCheckResult> {
  const res = await fetchInfinitePay(`${INFINITEPAY_API_BASE}/payment_check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle: INFINITEPAY_HANDLE,
      order_nsu: orderNsu,
      transaction_nsu: transactionNsu,
      slug,
    }),
  })

  const data = (await res.json().catch(() => null)) as PaymentCheckResult | null
  if (!res.ok || !data) {
    throw new Error(`InfinitePay /payment_check ${res.status}`)
  }
  return data
}

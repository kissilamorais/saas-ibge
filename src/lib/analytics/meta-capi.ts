// Meta Conversions API (server-side). Espelha o Purchase do pixel do browser,
// mas é imune a ad-blocker e não depende do usuário chegar/ficar na página de
// obrigado. Dedup com o pixel do browser via `event_id` (usamos o order_nsu).
//
// Regra de ativação idêntica ao pixel do browser: só produção + config presente.
// Em dev é no-op — nenhum evento falso é enviado.

import crypto from 'node:crypto'

import { log, reportError } from '@/lib/observability/log'

const GRAPH_VERSION = 'v19.0'
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const ACCESS_TOKEN = process.env.META_PIXEL_ACCESS_TOKEN
// Quando setado, os eventos aparecem SÓ na aba "Eventos de teste" do Meta
// (não contam como conversão real). Deixe vazio/removido em tráfego de campanha.
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE

const CAPI_ENABLED =
  process.env.NODE_ENV === 'production' &&
  Boolean(PIXEL_ID) &&
  Boolean(ACCESS_TOKEN)

// Espelha COURSE_PRICE_CENTS (9700) e o produto anunciado no pixel do browser.
const COURSE_VALUE_BRL = 97
const COURSE_CURRENCY = 'BRL'
const CONTENT_IDS = ['aprovus-ibge-2026']
const DEFAULT_SOURCE_URL = 'https://aprovus-ibge.vercel.app'

/** SHA256 do e-mail normalizado (lowercase + trim), como a Meta exige. */
function hashEmail(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex')
}

/** x-forwarded-for pode vir como "ip_cliente, proxy1, proxy2" — o 1º é o real. */
function firstIp(value?: string | null): string | undefined {
  if (!value) return undefined
  const ip = value.split(',')[0]?.trim()
  return ip || undefined
}

export interface MetaPurchaseInput {
  /** E-mail do comprador (em claro; é hasheado aqui). */
  email: string
  /** order_nsu do InfinitePay — vira event_id (dedup com o browser) e order_id. */
  orderId: string
  eventSourceUrl?: string
  clientIpAddress?: string | null
  clientUserAgent?: string | null
  /** cookie _fbp do browser, se disponível (melhora o match). */
  fbp?: string | null
  /** cookie _fbc do browser, se disponível (melhora o match). */
  fbc?: string | null
}

/**
 * Envia um Purchase para a Conversions API. Fire-and-forget: NUNCA bloqueia o
 * chamador (retorna void na hora) e nunca lança — falha só vira log. Logs com
 * prefixo `meta.conversions.api:` para facilitar o grep nos logs da Vercel.
 */
export function sendMetaPurchaseEvent(input: MetaPurchaseInput): void {
  if (!CAPI_ENABLED) return

  const userData: Record<string, unknown> = {
    em: [hashEmail(input.email)],
  }
  const ip = firstIp(input.clientIpAddress)
  if (ip) userData.client_ip_address = ip
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent
  if (input.fbp) userData.fbp = input.fbp
  if (input.fbc) userData.fbc = input.fbc

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.orderId, // dedup browser <-> server
        action_source: 'website',
        event_source_url: input.eventSourceUrl || DEFAULT_SOURCE_URL,
        user_data: userData,
        custom_data: {
          value: COURSE_VALUE_BRL,
          currency: COURSE_CURRENCY,
          content_ids: CONTENT_IDS,
          content_type: 'product',
          order_id: input.orderId,
        },
      },
    ],
    access_token: ACCESS_TOKEN,
    // Presente só quando estamos validando → eventos vão pra "Eventos de teste".
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events`

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (res.ok) {
        log.info('meta.conversions.api: purchase enviado', {
          orderId: input.orderId,
          test: Boolean(TEST_EVENT_CODE),
        })
        return
      }
      const body = await res.text().catch(() => '')
      log.warn('meta.conversions.api: resposta de erro', {
        orderId: input.orderId,
        status: res.status,
        body,
      })
    })
    .catch((err) =>
      reportError('meta.conversions.api', err, { orderId: input.orderId }),
    )
}

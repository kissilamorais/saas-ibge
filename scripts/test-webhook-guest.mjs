#!/usr/bin/env node
/**
 * Simula um evento `checkout.session.completed` de um pagamento GUEST
 * (sem `metadata.user_id`) e o envia, com assinatura válida da Stripe,
 * para o webhook local (`/api/stripe/webhook`).
 *
 * Uso:
 *   node scripts/test-webhook-guest.mjs
 *
 * Sem dependências externas — só built-ins do Node 18+ (crypto + fetch).
 */

import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ENV_PATH = join(__dirname, '..', '.env.local')

/** Lê chaves simples do .env.local (KEY=value), sem depender de dotenv. */
function loadEnv(path) {
  let raw
  try {
    raw = readFileSync(path, 'utf8')
  } catch {
    console.error(`❌ Falhou: não achei o arquivo ${path}`)
    process.exit(1)
  }
  const env = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    // Remove aspas envolventes, se houver.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const env = loadEnv(ENV_PATH)
const WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET
const APP_URL = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

if (!WEBHOOK_SECRET) {
  console.error('❌ Falhou: STRIPE_WEBHOOK_SECRET não encontrado em .env.local')
  process.exit(1)
}

// O webhook local roda no mesmo host do app em dev. Forçamos localhost:3001,
// mesmo que NEXT_PUBLIC_APP_URL aponte para produção.
const WEBHOOK_URL = 'http://localhost:3001/api/stripe/webhook'

const now = Math.floor(Date.now() / 1000)

// Payload que imita um evento real da Stripe. Só os campos que o handler lê
// de fato importam (metadata, customer, customer_details.email, etc.), mas
// incluímos os campos obrigatórios do envelope do evento para ficar fiel.
const eventPayload = {
  id: 'evt_test_guest_001',
  object: 'event',
  api_version: '2024-06-20',
  created: now,
  livemode: false,
  pending_webhooks: 1,
  request: { id: null, idempotency_key: null },
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_guest_001',
      object: 'checkout.session',
      mode: 'payment',
      status: 'complete',
      payment_status: 'paid',
      livemode: false,
      created: now,
      currency: 'brl',
      amount_total: 9700,
      amount_subtotal: 9700,
      customer: 'cus_test_guest_001',
      customer_email: null,
      customer_details: {
        email: 'teste-guest-aprovus@mailinator.com',
        name: 'Teste Guest Aprovus',
        phone: null,
        address: null,
        tax_exempt: 'none',
        tax_ids: [],
      },
      metadata: { flow: 'guest' },
      payment_intent: 'pi_test_guest_001',
      subscription: null,
      client_reference_id: null,
    },
  },
}

const payload = JSON.stringify(eventPayload)

// Assinatura no formato exato da Stripe:
//   signed_payload = `${timestamp}.${payload}`
//   v1 = HMAC-SHA256(secret, signed_payload) em hex
//   header = `t=${timestamp},v1=${v1}`
const signedPayload = `${now}.${payload}`
const signature = createHmac('sha256', WEBHOOK_SECRET)
  .update(signedPayload, 'utf8')
  .digest('hex')
const stripeSignature = `t=${now},v1=${signature}`

async function main() {
  console.log('→ Enviando evento para:', WEBHOOK_URL)
  console.log('→ Payload (resumo):', {
    id: eventPayload.id,
    type: eventPayload.type,
    session: eventPayload.data.object.id,
    metadata: eventPayload.data.object.metadata,
    email: eventPayload.data.object.customer_details.email,
    customer: eventPayload.data.object.customer,
    payment_status: eventPayload.data.object.payment_status,
  })
  console.log('→ stripe-signature:', stripeSignature)
  console.log('')

  let res
  try {
    res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'stripe-signature': stripeSignature,
      },
      body: payload,
    })
  } catch (err) {
    console.error(
      '❌ Falhou: não consegui conectar no webhook. O servidor está rodando em localhost:3001?'
    )
    console.error('   Detalhe:', err.message)
    process.exit(1)
  }

  const text = await res.text()
  console.log('← Status HTTP:', res.status)
  console.log('← Body:', text)
  console.log('')

  if (res.ok) {
    console.log('✅ Sucesso')
  } else {
    console.log(`❌ Falhou: HTTP ${res.status} — ${text}`)
    process.exit(1)
  }
}

main()

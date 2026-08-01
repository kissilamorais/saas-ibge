import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/infinitepay/server', () => ({
  checkInfinitePayPayment: vi.fn(),
}))
vi.mock('@/lib/onboarding/guest', () => ({
  onboardGuestByEmail: vi.fn().mockResolvedValue({ userId: 'u1', isNewUser: true }),
}))
vi.mock('@/lib/analytics/meta-capi', () => ({
  sendMetaPurchaseEvent: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/url/resolve-app-url', () => ({
  resolveAppUrl: () => 'https://app.test',
}))

import { createAdminClient } from '@/lib/supabase/admin'
import { checkInfinitePayPayment } from '@/lib/infinitepay/server'
import { onboardGuestByEmail } from '@/lib/onboarding/guest'
import { sendMetaPurchaseEvent } from '@/lib/analytics/meta-capi'
import { POST } from './route'

/**
 * Regressão do fluxo de pagamento (auditoria 31/07/2026, item 24 do Bloco 3):
 * VUL-A01 já tem teste ao vivo (scripts/test-rls.mjs) e VUL-A02 tem 10 testes
 * unitários do predicado puro (settlement.test.ts). O que faltava é a
 * INTEGRAÇÃO das duas coisas dentro do handler — claim atômico
 * (pending → paid, idempotente em reentrega) + o gate de settlement
 * plugado corretamente no fluxo real. Mocka só as bordas de I/O (Supabase,
 * chamada HTTP ao InfinitePay, onboarding, Meta CAPI); o handler roda de
 * verdade.
 */

type PendingOrderRow = {
  order_nsu: string
  status: string
  customer_email: string | null
  amount: number | null
  marketing_consent: boolean | null
}

/** Fake mínimo do client admin: só a superfície que a rota toca em `pending_orders`. */
function fakePendingOrdersAdmin(initial: PendingOrderRow) {
  const state = { row: { ...initial } }

  function builder() {
    const filters: [string, unknown][] = []
    let updatePatch: Partial<PendingOrderRow> | null = null

    function matches() {
      return filters.every(([col, val]) => (state.row as Record<string, unknown>)[col] === val)
    }

    async function resolve() {
      const hit = matches()
      if (updatePatch && hit) Object.assign(state.row, updatePatch)
      const data = hit ? [{ order_nsu: state.row.order_nsu }] : []
      return { data, error: null }
    }

    const api = {
      select() {
        return api
      },
      update(patch: Partial<PendingOrderRow>) {
        updatePatch = patch
        return api
      },
      eq(col: string, val: unknown) {
        filters.push([col, val])
        return api
      },
      async maybeSingle() {
        const hit = matches()
        return { data: hit ? { ...state.row } : null, error: null }
      },
      then(
        resolveFn: (value: { data: unknown; error: null }) => unknown,
        rejectFn?: (reason: unknown) => unknown,
      ) {
        return resolve().then(resolveFn, rejectFn)
      },
    }
    return api
  }

  const admin = {
    from(table: string) {
      if (table !== 'pending_orders') {
        throw new Error(`fake não cobre a tabela "${table}"`)
      }
      return builder()
    },
  }

  return { admin, state }
}

function makeRequest(body: Record<string, unknown>) {
  return new Request('https://app.test/api/infinitepay/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/infinitepay/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('confirma o pagamento, marca pago e faz onboarding + Purchase', async () => {
    const { admin, state } = fakePendingOrdersAdmin({
      order_nsu: 'ord-1',
      status: 'pending',
      customer_email: 'comprador@example.com',
      amount: 6700,
      marketing_consent: true,
    })
    vi.mocked(createAdminClient).mockReturnValue(admin as never)
    vi.mocked(checkInfinitePayPayment).mockResolvedValue({
      paid: true,
      paid_amount: 6700,
    })

    const res = await POST(
      makeRequest({ order_nsu: 'ord-1', transaction_nsu: 'tx-1', invoice_slug: 'slug-1' }),
    )
    const json = await res.json()

    expect(json).toEqual({ received: true })
    expect(state.row.status).toBe('paid')
    expect(onboardGuestByEmail).toHaveBeenCalledTimes(1)
    expect(sendMetaPurchaseEvent).toHaveBeenCalledTimes(1)
  })

  it('idempotente: reentrega de um pedido já pago não reprocessa', async () => {
    const { admin } = fakePendingOrdersAdmin({
      order_nsu: 'ord-2',
      status: 'paid',
      customer_email: 'comprador@example.com',
      amount: 6700,
      marketing_consent: true,
    })
    vi.mocked(createAdminClient).mockReturnValue(admin as never)
    vi.mocked(checkInfinitePayPayment).mockResolvedValue({
      paid: true,
      paid_amount: 6700,
    })

    const res = await POST(
      makeRequest({ order_nsu: 'ord-2', transaction_nsu: 'tx-2', invoice_slug: 'slug-2' }),
    )
    const json = await res.json()

    expect(json).toEqual({ received: true, duplicate: true })
    expect(onboardGuestByEmail).not.toHaveBeenCalled()
    expect(sendMetaPurchaseEvent).not.toHaveBeenCalled()
  })

  it('VUL-A02: valor liquidado menor que o pedido não provisiona acesso', async () => {
    const { admin, state } = fakePendingOrdersAdmin({
      order_nsu: 'ord-3',
      status: 'pending',
      customer_email: 'comprador@example.com',
      amount: 6700,
      marketing_consent: true,
    })
    vi.mocked(createAdminClient).mockReturnValue(admin as never)
    // Link forjado de R$0,01 reusando o order_nsu — o ataque que a VUL-A02 fechou.
    vi.mocked(checkInfinitePayPayment).mockResolvedValue({
      paid: true,
      paid_amount: 1,
    })

    const res = await POST(
      makeRequest({ order_nsu: 'ord-3', transaction_nsu: 'tx-3', invoice_slug: 'slug-3' }),
    )
    const json = await res.json()

    expect(json.received).toBe(true)
    expect(json.skipped).toBe('amount_mismatch')
    expect(state.row.status).toBe('pending')
    expect(onboardGuestByEmail).not.toHaveBeenCalled()
    expect(sendMetaPurchaseEvent).not.toHaveBeenCalled()
  })

  it('VUL-A04: sem opt-in de marketing, onboarda mas não dispara Purchase pra Meta', async () => {
    const { admin, state } = fakePendingOrdersAdmin({
      order_nsu: 'ord-4',
      status: 'pending',
      customer_email: 'comprador@example.com',
      amount: 6700,
      marketing_consent: false,
    })
    vi.mocked(createAdminClient).mockReturnValue(admin as never)
    vi.mocked(checkInfinitePayPayment).mockResolvedValue({
      paid: true,
      paid_amount: 6700,
    })

    await POST(
      makeRequest({ order_nsu: 'ord-4', transaction_nsu: 'tx-4', invoice_slug: 'slug-4' }),
    )

    expect(state.row.status).toBe('paid')
    expect(onboardGuestByEmail).toHaveBeenCalledTimes(1)
    expect(sendMetaPurchaseEvent).not.toHaveBeenCalled()
  })

  it('pedido desconhecido (não emitido por nós) é no-op seguro', async () => {
    const { admin } = fakePendingOrdersAdmin({
      order_nsu: 'outro-pedido',
      status: 'pending',
      customer_email: 'x@example.com',
      amount: 6700,
      marketing_consent: null,
    })
    vi.mocked(createAdminClient).mockReturnValue(admin as never)

    const res = await POST(
      makeRequest({ order_nsu: 'ord-inexistente', transaction_nsu: 'tx-5', invoice_slug: 'slug-5' }),
    )
    const json = await res.json()

    expect(json).toEqual({ received: true, skipped: 'unknown_order' })
    expect(checkInfinitePayPayment).not.toHaveBeenCalled()
  })
})

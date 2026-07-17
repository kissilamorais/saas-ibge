'use client'

import { useEffect, useRef } from 'react'

import { trackPixel } from '@/lib/analytics/meta-pixel'

// Valor do curso (espelha COURSE_PRICE_CENTS = 9700 em lib/stripe/server.ts).
const COURSE_VALUE_BRL = 97
const COURSE_CURRENCY = 'BRL'

/**
 * Dispara o Purchase do Meta Pixel na página de obrigado do fluxo guest.
 * O pagamento já foi confirmado server-side na Stripe (a success route só
 * redireciona pra cá quando `payment_status === 'paid'`), então é seguro
 * contar a conversão aqui.
 *
 * Anti-duplicação: guarda um flag no sessionStorage com a chave do
 * `session_id` da Stripe. Assim um refresh (mesmo session_id) não reconta, e
 * uma nova compra (session_id diferente) conta normalmente. O `useRef` cobre
 * o StrictMode/duplo-mount em dev.
 */
export function GuestPurchaseTracker({ sessionId }: { sessionId?: string }) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return

    const key = `aprovus_purchase_${sessionId || 'guest'}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // sessionStorage indisponível (modo restrito): segue e conta uma vez
      // por montagem, protegido apenas pelo useRef acima.
    }

    fired.current = true
    trackPixel('Purchase', {
      value: COURSE_VALUE_BRL,
      currency: COURSE_CURRENCY,
    })
  }, [sessionId])

  return null
}

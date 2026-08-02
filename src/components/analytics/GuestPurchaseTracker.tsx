'use client'

import { useEffect, useRef } from 'react'

import { trackPixel } from '@/lib/analytics/meta-pixel'
import { getCurrentPriceBRL } from '@/lib/pricing'

const COURSE_CURRENCY = 'BRL'
const CONTENT_IDS = ['aprovus-ibge-2026']

/**
 * Dispara o Purchase do Meta Pixel na página de obrigado do fluxo guest.
 * O pagamento já foi confirmado server-side pelo `payment_check` do
 * InfinitePay antes deste componente ser renderizado, então é seguro contar a
 * conversão aqui.
 *
 * Anti-duplicação: guarda um flag no sessionStorage com a chave do `order_nsu`
 * do pedido. Assim um refresh (mesmo pedido) não reconta, e uma nova compra
 * (order_nsu diferente) conta normalmente. O `useRef` cobre o StrictMode/
 * duplo-mount em dev.
 */
export function GuestPurchaseTracker({
  sessionId,
  valueBRL,
}: {
  sessionId?: string
  /**
   * Valor pago em reais. O evento gêmeo da Conversions API já reporta o valor
   * real do pedido; passe o mesmo aqui quando disponível para os dois lados do
   * dedup baterem. Sem isso, cai no preço vigente.
   */
  valueBRL?: number
}) {
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
    trackPixel(
      'Purchase',
      {
        value: valueBRL ?? getCurrentPriceBRL(),
        currency: COURSE_CURRENCY,
        content_ids: CONTENT_IDS,
        content_type: 'product',
      },
      // eventID = order_nsu → dedup com o Purchase enviado pela Conversions API.
      sessionId ? { eventID: sessionId } : undefined
    )
  }, [sessionId, valueBRL])

  return null
}

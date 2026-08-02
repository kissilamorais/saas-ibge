'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { trackPixel } from '@/lib/analytics/meta-pixel'
import { getCurrentPriceBRL } from '@/lib/pricing'

const COURSE_CURRENCY = 'BRL'

/**
 * Dispara o Purchase quando o comprador chega ao dashboard com "welcome=1",
 * marcador posto após o pagamento confirmado. Dispara uma vez e limpa o param
 * da URL para não recontar em refresh/navegação.
 *
 * DORMENTE: hoje nenhum fluxo produz `welcome=1` — quem o emitia era a rota
 * /checkout/success do Stripe, removida. O checkout atual (InfinitePay) sempre
 * volta para /checkout/obrigado, que conta a conversão pelo
 * `GuestPurchaseTracker`. Mantido por ser agnóstico ao provedor: um futuro
 * fluxo de compra logada só precisa redirecionar para /dashboard?welcome=1.
 */
export function PurchaseTracker() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    if (searchParams.get('welcome') !== '1') return

    fired.current = true
    // Resolvido dentro do efeito: o componente não renderiza nada, então usar
    // o relógio do browser aqui não cria divergência de hidratação.
    trackPixel('Purchase', {
      value: getCurrentPriceBRL(),
      currency: COURSE_CURRENCY,
    })

    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.delete('welcome')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, router, pathname])

  return null
}

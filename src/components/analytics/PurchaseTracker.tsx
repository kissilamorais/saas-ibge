'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { trackPixel } from '@/lib/analytics/meta-pixel'
import { getCurrentPriceBRL } from '@/lib/pricing'

const COURSE_CURRENCY = 'BRL'

/**
 * Após o pagamento, /checkout/success redireciona para /dashboard?welcome=1.
 * Esse "welcome=1" é o sinal confiável de compra paga (confirmada na Stripe),
 * então disparamos o Purchase aqui — uma vez — e limpamos o param da URL
 * para não recontar em refresh/navegação.
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

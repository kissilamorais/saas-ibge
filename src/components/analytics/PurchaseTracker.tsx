'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { trackPixel } from '@/lib/analytics/meta-pixel'

// Valor do curso (espelha COURSE_PRICE_CENTS = 9700 em lib/stripe/server.ts).
const COURSE_VALUE_BRL = 97
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
    trackPixel('Purchase', {
      value: COURSE_VALUE_BRL,
      currency: COURSE_CURRENCY,
    })

    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.delete('welcome')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, router, pathname])

  return null
}

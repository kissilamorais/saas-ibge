import Stripe from 'stripe'

// Instanciação lazy: o SDK lança erro se criado sem chave. Como a chave só
// existe em runtime (não no build), criamos o cliente apenas no primeiro uso.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY não configurada')
    _stripe = new Stripe(key)
  }
  return _stripe
}

// Preço do produto: R$97 em centavos.
export const COURSE_PRICE_CENTS = 9700
export const COURSE_CURRENCY = 'brl'
export const COURSE_NAME = 'Acesso vitalício — Curso ACA IBGE'

import Stripe from 'stripe'

// Instanciação lazy: o SDK lança erro se criado sem chave. Como a chave só
// existe em runtime (não no build), criamos o cliente apenas no primeiro uso.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY não configurada')
    // Fixa a versão da API para o payload não mudar sob nossos pés quando a
    // Stripe atualizar a versão default da conta. Casado com a versão do SDK.
    _stripe = new Stripe(key, { apiVersion: '2026-05-27.dahlia' })
  }
  return _stripe
}

// Preço do produto: varia com o prazo de lançamento — ver `lib/pricing.ts`.
// Reexportado aqui só por conveniência dos módulos de pagamento; a definição
// mora fora deste arquivo porque client components também precisam dela e não
// podem importar um módulo que carrega a secret key da Stripe.
export { getCurrentPriceCents } from '@/lib/pricing'
export const COURSE_CURRENCY = 'brl'
export const COURSE_NAME = 'Aprovus - Preparatório IBGE'

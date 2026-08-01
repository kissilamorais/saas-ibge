/**
 * Predicado puro da liquidação de um pagamento InfinitePay (sem I/O, testável).
 *
 * Existe separado de `server.ts` — e não inline nos handlers — porque a
 * confirmação acontece em DUAS portas independentes que precisam decidir
 * exatamente igual:
 *   - o webhook (`/api/infinitepay/webhook`), e
 *   - a rede de segurança da página de obrigado (`/checkout/obrigado`),
 * que roda quando o webhook atrasa. Corrigir só uma delas não fecha nada.
 *
 * Por que o VALOR importa (VUL-A02 da auditoria de 31/07/2026): a API de
 * checkout do InfinitePay (`/links`) é pública, amarrada só ao `handle` da
 * conta — qualquer pessoa cria um link de R$0,01 reusando um `order_nsu`
 * nosso, paga, e o `payment_check` responde `paid: true` com toda a razão: o
 * pagamento existe mesmo. `paid` sozinho prova que ALGUM dinheiro entrou, não
 * que o PREÇO foi pago. Sem comparar com o valor gravado em `pending_orders`,
 * o acesso vitalício sai por um centavo.
 */

import type { PaymentCheckResult } from './server'

export type SettlementReason =
  | 'ok'
  /** `payment_check` não confirmou o pagamento (ou ainda não liquidou). */
  | 'not_paid'
  /** Resposta sem valor algum — não dá para afirmar que o preço foi pago. */
  | 'amount_missing'
  /** Pedido sem valor gravado — não há com o que comparar. */
  | 'expected_missing'
  /** Pagou menos que o preço do pedido (link forjado / valor adulterado). */
  | 'amount_mismatch'

export interface SettlementVerdict {
  settled: boolean
  reason: SettlementReason
  /** Centavos efetivamente pagos, quando informados. */
  paidCents: number | null
  /** Centavos esperados (pending_orders.amount). */
  expectedCents: number | null
}

/**
 * Decide se um pagamento pode liberar acesso.
 *
 * Fail-closed em todos os ramos: valor ausente dos dois lados NÃO é tratado
 * como "deve estar certo". Se a resposta do provedor mudar de formato, o pior
 * resultado é um pedido que fica pendente e um alerta — nunca acesso liberado
 * sem prova de pagamento integral.
 *
 * `paid_amount` tem precedência sobre `amount`: o primeiro é o que de fato foi
 * liquidado, o segundo é o valor do link.
 */
export function evaluateSettlement(
  check: Pick<PaymentCheckResult, 'paid' | 'amount' | 'paid_amount'> | null,
  expectedCents: number | null | undefined,
): SettlementVerdict {
  const paidCents = check?.paid_amount ?? check?.amount ?? null
  const expected = expectedCents ?? null

  if (check?.paid !== true) {
    return { settled: false, reason: 'not_paid', paidCents, expectedCents: expected }
  }
  if (paidCents == null) {
    return { settled: false, reason: 'amount_missing', paidCents, expectedCents: expected }
  }
  if (expected == null) {
    return { settled: false, reason: 'expected_missing', paidCents, expectedCents: expected }
  }
  // `<` e não `!==`: pagar A MAIS (troco, gorjeta, arredondamento do provedor)
  // não é fraude e não pode barrar quem pagou.
  if (paidCents < expected) {
    return { settled: false, reason: 'amount_mismatch', paidCents, expectedCents: expected }
  }

  return { settled: true, reason: 'ok', paidCents, expectedCents: expected }
}

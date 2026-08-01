import { describe, expect, it } from 'vitest'

import { evaluateSettlement } from './settlement'

/**
 * VUL-A02: a API /links do InfinitePay é pública por handle, então um link de
 * R$0,01 com o nosso order_nsu produz um `paid: true` legítimo. Estes testes
 * fixam a regra de que `paid` sozinho NUNCA libera acesso.
 */
describe('evaluateSettlement', () => {
  const PRECO = 6700 // R$67 — LAUNCH_PRICE_CENTS

  it('liquida quando o valor pago cobre o preço do pedido', () => {
    const v = evaluateSettlement({ paid: true, paid_amount: 6700 }, PRECO)
    expect(v.settled).toBe(true)
    expect(v.reason).toBe('ok')
  })

  it('RECUSA pagamento de centavos com paid=true (o ataque da VUL-A02)', () => {
    const v = evaluateSettlement({ paid: true, paid_amount: 1 }, PRECO)
    expect(v.settled).toBe(false)
    expect(v.reason).toBe('amount_mismatch')
    expect(v.paidCents).toBe(1)
    expect(v.expectedCents).toBe(PRECO)
  })

  it('recusa qualquer valor abaixo do preço, mesmo que próximo', () => {
    expect(evaluateSettlement({ paid: true, paid_amount: 6699 }, PRECO).settled).toBe(
      false,
    )
  })

  it('aceita pagamento a MAIOR — pagar além do preço não é fraude', () => {
    expect(evaluateSettlement({ paid: true, paid_amount: 9700 }, PRECO).settled).toBe(
      true,
    )
  })

  it('usa paid_amount em vez de amount quando os dois vêm', () => {
    // amount = valor do link; paid_amount = o que de fato liquidou. Um link
    // forjado pode anunciar o preço cheio e liquidar centavos.
    const v = evaluateSettlement({ paid: true, amount: 6700, paid_amount: 1 }, PRECO)
    expect(v.settled).toBe(false)
    expect(v.reason).toBe('amount_mismatch')
  })

  it('cai em amount quando paid_amount não vem', () => {
    expect(evaluateSettlement({ paid: true, amount: 6700 }, PRECO).settled).toBe(true)
  })

  it('recusa quando paid não é true', () => {
    expect(evaluateSettlement({ paid: false, paid_amount: 6700 }, PRECO).reason).toBe(
      'not_paid',
    )
    expect(evaluateSettlement({ paid_amount: 6700 }, PRECO).reason).toBe('not_paid')
    expect(evaluateSettlement(null, PRECO).reason).toBe('not_paid')
  })

  it('fail-closed: sem valor na resposta do provedor, não libera', () => {
    const v = evaluateSettlement({ paid: true }, PRECO)
    expect(v.settled).toBe(false)
    expect(v.reason).toBe('amount_missing')
  })

  it('fail-closed: sem valor esperado no pedido, não libera', () => {
    expect(evaluateSettlement({ paid: true, paid_amount: 6700 }, null).reason).toBe(
      'expected_missing',
    )
    expect(
      evaluateSettlement({ paid: true, paid_amount: 6700 }, undefined).reason,
    ).toBe('expected_missing')
  })

  it('não trata 0 como valor ausente', () => {
    // `?? `, não `||`: um pagamento de 0 centavos é um valor informado — e uma
    // divergência —, não uma resposta sem valor.
    const v = evaluateSettlement({ paid: true, paid_amount: 0 }, PRECO)
    expect(v.reason).toBe('amount_mismatch')
  })
})

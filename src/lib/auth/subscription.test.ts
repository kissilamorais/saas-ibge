import { describe, expect, it } from 'vitest'

import { isSubscriptionActive } from './subscription'

describe('isSubscriptionActive (gate de conteúdo pago)', () => {
  it('libera só quando o status é "active"', () => {
    expect(isSubscriptionActive('active')).toBe(true)
  })

  it('bloqueia os demais estados', () => {
    for (const s of ['inactive', 'cancelled', 'expired']) {
      expect(isSubscriptionActive(s)).toBe(false)
    }
  })

  it('bloqueia quando ausente (null/undefined)', () => {
    expect(isSubscriptionActive(null)).toBe(false)
    expect(isSubscriptionActive(undefined)).toBe(false)
  })
})

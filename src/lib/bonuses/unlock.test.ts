import { describe, expect, it } from 'vitest'

import {
  BONUSES,
  EXAM_DATE,
  FINAL_REVIEW_DATE,
  getBonus,
  type Bonus,
} from './config'
import {
  daysUntilUnlock,
  formatUnlockDate,
  isUnlocked,
  spCalendarDate,
  unlockDate,
} from './unlock'

// Instante em UTC. Brasília = UTC−3 (sem horário de verão desde 2019).
const at = (iso: string) => new Date(iso)

const cronograma = getBonus('cronograma')!
const edital = getBonus('edital-esquematizado')!
const telegram = getBonus('grupo-telegram')!
const revisao = getBonus('revisao-final')!

describe('config', () => {
  it('a revisão final abre 7 dias antes da prova (20/09/2026)', () => {
    expect(EXAM_DATE).toBe('2026-09-27')
    expect(FINAL_REVIEW_DATE).toBe('2026-09-20')
    expect(revisao.unlock).toEqual({ type: 'fixed', date: '2026-09-20' })
  })

  it('slugs são únicos', () => {
    const slugs = BONUSES.map((b) => b.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('spCalendarDate', () => {
  it('usa o dia-calendário de São Paulo, não o de UTC', () => {
    // 03:30 UTC = 00:30 em Brasília → ainda dia 10.
    expect(spCalendarDate(at('2026-06-10T03:30:00Z'))).toBe('2026-06-10')
    // 02:30 UTC = 23:30 do dia anterior em Brasília → dia 9.
    expect(spCalendarDate(at('2026-06-10T02:30:00Z'))).toBe('2026-06-09')
  })
})

describe('isUnlocked — cronograma (imediato na compra)', () => {
  const purchase = '2026-06-10T15:00:00Z'

  it('libera no mesmo dia da compra', () => {
    expect(isUnlocked(cronograma, purchase, at('2026-06-10T18:00:00Z'))).toBe(
      true,
    )
  })

  it('fica bloqueado sem data de compra', () => {
    expect(isUnlocked(cronograma, null, at('2026-06-10T18:00:00Z'))).toBe(false)
  })
})

describe('isUnlocked — edital/telegram (7 dias após a compra)', () => {
  const purchase = '2026-06-10T15:00:00Z' // dia 10 em SP

  it('bloqueado no dia da compra', () => {
    expect(isUnlocked(edital, purchase, at('2026-06-10T20:00:00Z'))).toBe(false)
    expect(isUnlocked(telegram, purchase, at('2026-06-10T20:00:00Z'))).toBe(
      false,
    )
  })

  it('bloqueado no 6º dia', () => {
    expect(isUnlocked(edital, purchase, at('2026-06-16T20:00:00Z'))).toBe(false)
  })

  it('libera exatamente no 7º dia (17/06)', () => {
    expect(isUnlocked(edital, purchase, at('2026-06-17T09:00:00Z'))).toBe(true)
    expect(isUnlocked(telegram, purchase, at('2026-06-17T09:00:00Z'))).toBe(
      true,
    )
    expect(unlockDate(edital, purchase)).toBe('2026-06-17')
  })

  it('conta dia-calendário de SP: compra 23h30 de Brasília abre 7 dias depois', () => {
    // 2026-06-11T02:30Z = 2026-06-10 23:30 em SP → dia da compra é 10.
    const lateNight = '2026-06-11T02:30:00Z'
    expect(unlockDate(edital, lateNight)).toBe('2026-06-17')
  })
})

describe('isUnlocked — revisão final (data fixa, todos)', () => {
  it('libera para quem nunca comprou, a partir da data fixa', () => {
    expect(isUnlocked(revisao, null, at('2026-09-19T20:00:00Z'))).toBe(false)
    // 2026-09-20 03:00Z = 00:00 em SP do dia 20 → liberado.
    expect(isUnlocked(revisao, null, at('2026-09-20T03:00:00Z'))).toBe(true)
  })

  it('independe da data de compra', () => {
    const purchase = '2026-09-01T12:00:00Z'
    expect(isUnlocked(revisao, purchase, at('2026-09-19T12:00:00Z'))).toBe(false)
    expect(isUnlocked(revisao, purchase, at('2026-09-26T12:00:00Z'))).toBe(true)
  })
})

describe('daysUntilUnlock', () => {
  it('conta os dias que faltam para o edital', () => {
    const purchase = '2026-06-10T15:00:00Z'
    expect(daysUntilUnlock(edital, purchase, at('2026-06-10T18:00:00Z'))).toBe(7)
    expect(daysUntilUnlock(edital, purchase, at('2026-06-16T18:00:00Z'))).toBe(1)
    expect(daysUntilUnlock(edital, purchase, at('2026-06-17T18:00:00Z'))).toBe(0)
  })

  it('é null quando indeterminado (regra por compra, sem compra)', () => {
    expect(daysUntilUnlock(edital, null, at('2026-06-10T18:00:00Z'))).toBeNull()
  })

  it('conta os dias para a revisão mesmo sem compra', () => {
    expect(daysUntilUnlock(revisao, null, at('2026-09-18T12:00:00Z'))).toBe(2)
  })
})

describe('formatUnlockDate', () => {
  it('formata YYYY-MM-DD como dd/mm/aaaa', () => {
    expect(formatUnlockDate('2026-09-20')).toBe('20/09/2026')
  })
})

// Guard de tipos: garante que toda regra é uma das duas conhecidas.
describe('exaustividade das regras', () => {
  it('toda regra é purchase-offset ou fixed', () => {
    for (const b of BONUSES as Bonus[]) {
      expect(['purchase-offset', 'fixed']).toContain(b.unlock.type)
    }
  })
})

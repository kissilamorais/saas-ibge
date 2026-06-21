import { describe, expect, it } from 'vitest'

import { computeScore, PASS_PERCENT, type SubmittedAnswer } from './scoring'

const gabarito = new Map<string, string>([
  ['q1', 'a'],
  ['q2', 'b'],
  ['q3', 'c'],
  ['q4', 'd'],
])

describe('computeScore', () => {
  it('conta apenas as respostas que batem com o gabarito do servidor', () => {
    const answers: SubmittedAnswer[] = [
      { questionId: 'q1', optionId: 'a' }, // certa
      { questionId: 'q2', optionId: 'x' }, // errada
      { questionId: 'q3', optionId: 'c' }, // certa
    ]
    const r = computeScore(answers, gabarito, 4)
    expect(r.score).toBe(2)
    expect(r.total).toBe(4)
    expect(r.percentage).toBe(50)
    expect(r.passed).toBe(false)
  })

  it('usa o total autoritativo (do banco), não o nº de respostas enviadas', () => {
    // Cliente "esperto" manda 1 resposta certa esperando 100%.
    const answers: SubmittedAnswer[] = [{ questionId: 'q1', optionId: 'a' }]
    const r = computeScore(answers, gabarito, 4)
    expect(r.score).toBe(1)
    expect(r.percentage).toBe(25) // 1/4, não 1/1
  })

  it('aprova quando atinge o limiar de aprovação', () => {
    const answers: SubmittedAnswer[] = [
      { questionId: 'q1', optionId: 'a' },
      { questionId: 'q2', optionId: 'b' },
      { questionId: 'q3', optionId: 'c' },
      { questionId: 'q4', optionId: 'd' },
    ]
    const r = computeScore(answers, gabarito, 4)
    expect(r.percentage).toBe(100)
    expect(r.passed).toBe(true)
    expect(PASS_PERCENT).toBeGreaterThan(0)
  })

  it('ignora respostas para questões fora do gabarito', () => {
    const answers: SubmittedAnswer[] = [
      { questionId: 'q1', optionId: 'a' }, // certa
      { questionId: 'desconhecida', optionId: 'a' }, // não conta
    ]
    const r = computeScore(answers, gabarito, 4)
    expect(r.score).toBe(1)
  })

  it('não divide por zero quando o total é zero', () => {
    const r = computeScore([], gabarito, 0)
    expect(r.percentage).toBe(0)
    expect(r.passed).toBe(false)
  })
})

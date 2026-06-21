import { describe, expect, it } from 'vitest'

import {
  buildRecommendations,
  type RecommendationInput,
} from './recommendations'

const base: RecommendationInput = {
  moduleAccuracy: [],
  weeklyHoursDone: 25,
  weeklyGoalHours: 25,
  syllabusProgress: 0,
  nextLesson: null,
  nextExam: null,
}

describe('buildRecommendations', () => {
  it('sinaliza o módulo mais fraco (com amostra suficiente) como prioridade alta', () => {
    const recs = buildRecommendations({
      ...base,
      moduleAccuracy: [
        { slug: 'portugues', title: 'Português', correct: 9, total: 10 }, // 90%
        { slug: 'rl', title: 'Raciocínio Lógico', correct: 2, total: 10 }, // 20%
      ],
    })
    const fraqueza = recs.find((r) => r.kind === 'fraqueza')
    expect(fraqueza).toBeDefined()
    expect(fraqueza?.priority).toBe('alta')
    expect(fraqueza?.href).toBe('/dashboard/modules/rl')
  })

  it('ignora módulos com poucas respostas (amostra insuficiente)', () => {
    const recs = buildRecommendations({
      ...base,
      moduleAccuracy: [
        { slug: 'rl', title: 'Raciocínio Lógico', correct: 0, total: 2 },
      ],
    })
    expect(recs.some((r) => r.kind === 'fraqueza')).toBe(false)
  })

  it('gera recomendação de ritmo quando abaixo da meta semanal', () => {
    const recs = buildRecommendations({
      ...base,
      weeklyHoursDone: 5,
      weeklyGoalHours: 25,
    })
    const ritmo = recs.find((r) => r.kind === 'ritmo')
    expect(ritmo).toBeDefined()
    expect(ritmo?.priority).toBe('alta') // déficit > metade da meta
    expect(ritmo?.title).toContain('20')
  })

  it('não gera ritmo quando a meta já foi batida', () => {
    const recs = buildRecommendations({
      ...base,
      weeklyHoursDone: 30,
      weeklyGoalHours: 25,
    })
    expect(recs.some((r) => r.kind === 'ritmo')).toBe(false)
  })

  it('cai no empty state quando não há nada a recomendar', () => {
    const recs = buildRecommendations(base)
    expect(recs).toHaveLength(1)
    expect(recs[0].id).toBe('comecar')
  })

  it('ordena por prioridade e limita a 4', () => {
    const recs = buildRecommendations({
      moduleAccuracy: [
        { slug: 'rl', title: 'RL', correct: 1, total: 10 },
      ],
      weeklyHoursDone: 0,
      weeklyGoalHours: 25,
      syllabusProgress: 80,
      nextLesson: { moduleSlug: 'm', lessonSlug: 'l', title: 'Lição X' },
      nextExam: { slug: 's1', title: 'Simulado 1' },
    })
    expect(recs.length).toBeLessThanOrEqual(4)
    const order = ['alta', 'media', 'baixa']
    const idxs = recs.map((r) => order.indexOf(r.priority))
    expect(idxs).toEqual([...idxs].sort((a, b) => a - b))
  })
})

/**
 * Lógica pura de correção de simulado/quiz — sem I/O, para ser testável
 * isoladamente (ver src/lib/study/scoring.test.ts). A correção SEMPRE roda no
 * servidor: o gabarito (`correctByQuestion`) vem do banco, nunca do cliente.
 */

/** Nota mínima (%) para aprovação. */
export const PASS_PERCENT = 70

export interface SubmittedAnswer {
  questionId: string
  optionId: string
}

export interface ScoreResult {
  /** Acertos. */
  score: number
  /** Total de questões do simulado (autoritativo: vem do banco). */
  total: number
  /** Percentual de acerto arredondado (0–100). */
  percentage: number
  /** Aprovado se percentage >= PASS_PERCENT. */
  passed: boolean
}

/**
 * Conta acertos comparando as respostas do usuário com o gabarito do servidor.
 * `total` é o nº real de questões do simulado (não derivado do que o cliente
 * enviou), então respostas forjadas não inflam a nota.
 */
export function computeScore(
  answers: SubmittedAnswer[],
  correctByQuestion: Map<string, string>,
  total: number
): ScoreResult {
  const score = answers.reduce(
    (n, a) => (correctByQuestion.get(a.questionId) === a.optionId ? n + 1 : n),
    0
  )
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  return { score, total, percentage, passed: percentage >= PASS_PERCENT }
}

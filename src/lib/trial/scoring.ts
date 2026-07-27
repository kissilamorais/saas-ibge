import type { TrialAnswer, TrialResult } from './types'

/** Score ≥ este valor conta como domínio do módulo. */
const LIMIAR_DOMINIO = 70
/** Score < este valor entra em "precisa reforçar". */
const LIMIAR_REFORCO = 50

/**
 * Diagnóstico do teste gratuito a partir das respostas JÁ CORRIGIDAS.
 *
 * Recebe `TrialAnswer[]` (com `is_correct` resolvido contra o banco), nunca o
 * payload cru do cliente — quem corrige é `/api/trial/result`.
 *
 * A faixa entre os dois limiares (50–69%) é intencional: o módulo não entra em
 * "dominou" nem em "precisa reforçar", para o diagnóstico não soar contraditório.
 */
export function calcularResultado(answers: TrialAnswer[]): TrialResult {
  const total = answers.length

  // Sem respostas não há diagnóstico — evita divisão por zero virando NaN e
  // sendo gravada como null no numeric(5,2) do banco.
  if (total === 0) {
    return {
      score_geral: 0,
      nivel: 'Iniciante',
      score_por_modulo: {},
      dominou: [],
      precisa_estudar: [],
    }
  }

  const acertos = answers.filter((a) => a.is_correct).length
  const score_geral = Math.round((acertos / total) * 100)

  const porModulo: Record<string, { acertos: number; total: number }> = {}
  for (const a of answers) {
    porModulo[a.module_title] ??= { acertos: 0, total: 0 }
    porModulo[a.module_title].total++
    if (a.is_correct) porModulo[a.module_title].acertos++
  }

  const score_por_modulo: Record<string, number> = {}
  for (const [modulo, dados] of Object.entries(porModulo)) {
    score_por_modulo[modulo] = Math.round((dados.acertos / dados.total) * 100)
  }

  const nivel =
    score_geral >= 70
      ? 'Avançado'
      : score_geral >= 45
        ? 'Em desenvolvimento'
        : 'Iniciante'

  const dominou = Object.entries(score_por_modulo)
    .filter(([, s]) => s >= LIMIAR_DOMINIO)
    .map(([m]) => m)

  const precisa_estudar = Object.entries(score_por_modulo)
    .filter(([, s]) => s < LIMIAR_REFORCO)
    .map(([m]) => m)

  return { score_geral, nivel, score_por_modulo, dominou, precisa_estudar }
}

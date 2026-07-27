/**
 * Teste gratuito (diagnóstico de topo de funil).
 *
 * Fronteira de confiança: o cliente recebe `TrialQuestion` SEM `is_correct` e
 * devolve `TrialAnswerInput[]` (só os ids). A correção acontece no servidor
 * (`/api/trial/result`), que monta os `TrialAnswer` a partir do banco — mesma
 * regra dos simulados: gabarito nunca cruza para o cliente.
 */

export type TrialCargo = 'ACA' | 'ACI' | 'AOR' | 'ACR' | 'ACS'

export const TRIAL_CARGOS: { value: TrialCargo; label: string }[] = [
  { value: 'ACA', label: 'Agente de Coleta e Cadastramento' },
  { value: 'ACI', label: 'Agente Censitário de Informática' },
  { value: 'AOR', label: 'Agente de Pesquisa e Mapeamento' },
  { value: 'ACR', label: 'Agente Censitário de Recenseamento' },
  { value: 'ACS', label: 'Agente Censitário Supervisor' },
]

export function isTrialCargo(value: unknown): value is TrialCargo {
  return TRIAL_CARGOS.some((c) => c.value === value)
}

/** Opção como o cliente a vê — `is_correct` é removido no servidor. */
export interface TrialOption {
  id: string
  text: string
  order_index: number
}

export interface TrialQuestion {
  id: string
  question_text: string
  module_id: string
  module_title: string
  difficulty: string | null
  options: TrialOption[]
}

/** O que o cliente envia: apenas os ids. Nada de `is_correct`. */
export interface TrialAnswerInput {
  question_id: string
  selected_option_id: string
}

/** Resposta já corrigida no servidor. É o que vai para `free_trial_results`. */
export interface TrialAnswer extends TrialAnswerInput {
  is_correct: boolean
  module_title: string
}

export type TrialNivel = 'Iniciante' | 'Em desenvolvimento' | 'Avançado'

export interface TrialResult {
  score_geral: number
  nivel: TrialNivel
  score_por_modulo: Record<string, number>
  dominou: string[]
  precisa_estudar: string[]
}

/** Status comercial do lead no mini-CRM do admin. */
export type TrialStatus = 'nao_comprou' | 'contatado' | 'convertido' | 'sem_interesse'

export const TRIAL_STATUS_OPTIONS: { value: TrialStatus; label: string }[] = [
  { value: 'nao_comprou', label: 'Não comprou' },
  { value: 'contatado', label: 'Contatado' },
  { value: 'convertido', label: 'Convertido' },
  { value: 'sem_interesse', label: 'Sem interesse' },
]

export function isTrialStatus(value: unknown): value is TrialStatus {
  return TRIAL_STATUS_OPTIONS.some((s) => s.value === value)
}

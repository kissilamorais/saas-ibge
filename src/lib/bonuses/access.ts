import { getProfile, hasContentAccess } from '@/lib/auth/session'
import { BONUSES, getBonus, type Bonus } from './config'
import { daysUntilUnlock, isUnlocked, unlockDate } from './unlock'

/**
 * Camada de servidor que combina as DUAS dimensões de acesso de um bônus:
 *   1. Pagamento — hasContentAccess() (assinatura ativa ou cortesia), mesma
 *      fonte de verdade do RLS.
 *   2. Tempo — isUnlocked() sobre a data de compra e a data da prova.
 *
 * Um bônus só é entregue quando AS DUAS passam. A UI usa isto para render;
 * as rotas gated (página do bônus + /api/bonus/[slug]) usam para negar acesso.
 */

/** Estado de um bônus para exibição (todos são sempre exibidos). */
export interface BonusView {
  bonus: Bonus
  /** Liberado de fato (pago E dentro da janela temporal). */
  unlocked: boolean
  /** Só a dimensão temporal — usado para diferenciar "não pagou" de "ainda não abriu". */
  timeUnlocked: boolean
  /** true se o motivo do bloqueio é não ter comprado/pago. */
  needsPurchase: boolean
  /** Dias até abrir (null = indeterminado, ex.: bônus por compra sem compra). */
  daysUntil: number | null
  /** Data-calendário de abertura YYYY-MM-DD (null = indeterminado). */
  unlockOn: string | null
}

/**
 * Monta a view-model de todos os bônus para o usuário logado. Uma única leitura
 * de profile/acesso serve para os quatro (getProfile/hasContentAccess usam
 * cache() por request).
 */
export async function getBonusViews(now: Date = new Date()): Promise<BonusView[]> {
  const [profile, paid] = await Promise.all([getProfile(), hasContentAccess()])
  const purchaseDate = profile?.purchase_date ?? null

  return BONUSES.map((bonus) => {
    const timeUnlocked = isUnlocked(bonus, purchaseDate, now)
    return {
      bonus,
      unlocked: paid && timeUnlocked,
      timeUnlocked,
      needsPurchase: !paid,
      daysUntil: daysUntilUnlock(bonus, purchaseDate, now),
      unlockOn: unlockDate(bonus, purchaseDate),
    }
  })
}

/**
 * Resolve o acesso a UM bônus para o usuário logado. Retorna o bônus e se ele
 * pode ser entregue agora. Use no topo das rotas gated antes de servir conteúdo.
 * `bonus` é null quando o slug não existe.
 */
export async function resolveBonusAccess(
  slug: string,
  now: Date = new Date(),
): Promise<{ bonus: Bonus | null; canAccess: boolean }> {
  const bonus = getBonus(slug)
  if (!bonus) return { bonus: null, canAccess: false }

  const [profile, paid] = await Promise.all([getProfile(), hasContentAccess()])
  const canAccess = paid && isUnlocked(bonus, profile?.purchase_date ?? null, now)
  return { bonus, canAccess }
}

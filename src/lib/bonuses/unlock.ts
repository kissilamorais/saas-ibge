import type { Bonus } from './config'
import { EXAM_DATE } from './config'

/**
 * Lógica de desbloqueio temporal dos bônus — pura e testável. Todos os cálculos
 * de "dia" acontecem no fuso America/Sao_Paulo: o que importa para o aluno é o
 * dia-calendário em Brasília, não o instante UTC. Assim, comprar 23h55 de um dia
 * e comprar 00h05 do dia seguinte contam como dias diferentes, como ele espera.
 *
 * A comparação é feita sobre rótulos de data YYYY-MM-DD (lexicográfica, que para
 * ISO é equivalente à cronológica), evitando qualquer aritmética de horário.
 */

const SP_TIME_ZONE = 'America/Sao_Paulo'

/** Formata um instante como a data-calendário (YYYY-MM-DD) em São Paulo. */
export function spCalendarDate(instant: Date): string {
  // en-CA dá exatamente YYYY-MM-DD; o timeZone faz a conversão para Brasília.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

/** Soma `days` a uma data YYYY-MM-DD (aritmética de calendário em UTC puro). */
function addCalendarDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

/** Diferença em dias-calendário entre duas datas YYYY-MM-DD (b − a). */
function diffCalendarDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const aMs = Date.UTC(ay, am - 1, ad)
  const bMs = Date.UTC(by, bm - 1, bd)
  return Math.round((bMs - aMs) / 86_400_000)
}

/** Normaliza a entrada de data de compra para YYYY-MM-DD em SP (ou null). */
function purchaseCalendarDate(
  purchaseDate: string | Date | null | undefined,
): string | null {
  if (!purchaseDate) return null
  const instant =
    purchaseDate instanceof Date ? purchaseDate : new Date(purchaseDate)
  if (Number.isNaN(instant.getTime())) return null
  return spCalendarDate(instant)
}

/**
 * Data-calendário (YYYY-MM-DD, em SP) em que o bônus abre para este aluno.
 * Retorna `null` quando a regra depende da compra e o aluno ainda não comprou —
 * ou seja, "indeterminado / disponível após a compra".
 */
export function unlockDate(
  bonus: Bonus,
  purchaseDate: string | Date | null | undefined,
): string | null {
  if (bonus.unlock.type === 'fixed') {
    return bonus.unlock.date
  }
  // purchase-offset
  const purchased = purchaseCalendarDate(purchaseDate)
  if (!purchased) return null
  return addCalendarDays(purchased, bonus.unlock.days)
}

/**
 * `true` se o bônus já está liberado para este aluno em `now`.
 *
 * Regra: liberado quando o dia-calendário de hoje (SP) é >= o dia de
 * desbloqueio. Sem data de compra, bônus baseados em compra ficam bloqueados.
 *
 * NÃO cobre o gate de PAGAMENTO — isso é responsabilidade do chamador
 * (hasContentAccess no servidor). Aqui é só a dimensão temporal.
 */
export function isUnlocked(
  bonus: Bonus,
  purchaseDate: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  const unlock = unlockDate(bonus, purchaseDate)
  if (!unlock) return false
  const today = spCalendarDate(now)
  return today >= unlock
}

/**
 * Quantos dias faltam para o bônus abrir (0 se já abriu hoje ou antes).
 * `null` quando indeterminado (regra por compra sem data de compra).
 */
export function daysUntilUnlock(
  bonus: Bonus,
  purchaseDate: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  const unlock = unlockDate(bonus, purchaseDate)
  if (!unlock) return null
  const today = spCalendarDate(now)
  return Math.max(0, diffCalendarDays(today, unlock))
}

/**
 * Quantos dias-calendário faltam para a prova, contados em São Paulo — o mesmo
 * critério de "dia" usado no desbloqueio dos bônus. Nunca negativo: passada a
 * data, retorna 0 e a copy que depende disso precisa sair do ar.
 */
export function daysUntilExam(now: Date = new Date()): number {
  return Math.max(0, diffCalendarDays(spCalendarDate(now), EXAM_DATE))
}

/** Em que momento do ciclo da prova estamos (dia-calendário em São Paulo). */
export type ExamPhase = 'before' | 'exam-day' | 'after'

/**
 * Fase do ciclo da prova. Existe porque `daysUntilExam` satura em 0 e não
 * separa "hoje é a prova" de "a prova já passou" — dois estados com copy
 * diferente na landing.
 */
export function examPhase(now: Date = new Date()): ExamPhase {
  const today = spCalendarDate(now)
  if (today < EXAM_DATE) return 'before'
  return today === EXAM_DATE ? 'exam-day' : 'after'
}

/** Formata YYYY-MM-DD como dd/mm/aaaa para exibição. */
export function formatUnlockDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

/**
 * Helpers de formatação e cálculo de variação para o painel admin.
 * pt-BR em tudo (moeda, milhar, percentual).
 */

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatInt(n: number): string {
  return n.toLocaleString('pt-BR')
}

export function formatPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Duração em dias, legível: "—", "hoje", "3 dias", "1 dia". */
export function formatDays(days: number | null): string {
  if (days === null) return '—'
  const rounded = Math.round(days)
  if (rounded <= 0) return 'no mesmo dia'
  return `${rounded} ${rounded === 1 ? 'dia' : 'dias'}`
}

export type DeltaDirection = 'up' | 'down' | 'flat'

export interface Delta {
  /** Rótulo já formatado, ex.: "+12%", "novo", "−3 pp". */
  label: string
  direction: DeltaDirection
}

/**
 * Variação relativa (%) entre o período atual e o anterior.
 * - previous null → sem comparação (período "tudo") → retorna null.
 * - previous 0 e current > 0 → "novo" (não dá pra dividir por zero).
 */
export function relativeDelta(current: number, previous: number | null): Delta | null {
  if (previous === null) return null
  if (previous === 0) {
    if (current === 0) return { label: '0%', direction: 'flat' }
    return { label: 'novo', direction: 'up' }
  }
  const pct = ((current - previous) / previous) * 100
  const rounded = Math.round(pct)
  return {
    label: `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded)}%`,
    direction: rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat',
  }
}

/**
 * Variação em pontos percentuais (para métricas que já são % — ex.: conversão).
 */
export function pointsDelta(current: number, previous: number | null): Delta | null {
  if (previous === null) return null
  const diff = current - previous
  const rounded = Math.round(diff * 10) / 10
  return {
    label: `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded).toFixed(1)} pp`,
    direction: rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat',
  }
}

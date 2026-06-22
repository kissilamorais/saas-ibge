import { createAdminClient } from '@/lib/supabase/admin'
import { COURSE_PRICE_CENTS } from '@/lib/stripe/server'

/**
 * Queries agregadas do painel admin. SEMPRE no servidor, via service_role
 * (ignora RLS) — nunca expomos dados de todos os usuários ao cliente. Todas as
 * consultas usam `count`/`head` (não puxam linhas): só números agregados.
 *
 * Modelo de negócio: compra ÚNICA vitalícia (R$97). Por isso "receita" é
 * contagem de vendas × preço; "ativos" = pagantes ativos + cortesias válidas;
 * e no lugar de churn medimos cortesias revogadas no período.
 */

type Admin = ReturnType<typeof createAdminClient>

export type AdminPeriod = '7d' | '30d' | '90d' | 'all'

const PERIOD_DAYS: Record<Exclude<AdminPeriod, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

export function resolvePeriod(input?: string | null): AdminPeriod {
  if (input === '7d' || input === '30d' || input === '90d' || input === 'all') {
    return input
  }
  return '30d'
}

export const PERIOD_LABEL: Record<AdminPeriod, string> = {
  '7d': 'últimos 7 dias',
  '30d': 'últimos 30 dias',
  '90d': 'últimos 90 dias',
  all: 'todo o período',
}

interface Ranges {
  start: Date | null
  end: Date
  prevStart: Date | null
  prevEnd: Date | null
}

function ranges(period: AdminPeriod): Ranges {
  const now = new Date()
  if (period === 'all') {
    return { start: null, end: now, prevStart: null, prevEnd: null }
  }
  const ms = PERIOD_DAYS[period] * 86400000
  const start = new Date(now.getTime() - ms)
  return {
    start,
    end: now,
    prevStart: new Date(start.getTime() - ms),
    prevEnd: start,
  }
}

/** Métrica com valor atual e o do período anterior (null = sem comparação). */
export interface Metric {
  value: number
  previous: number | null
}

export interface AdminOverview {
  period: AdminPeriod
  hasComparison: boolean
  /** Há qualquer cadastro/venda na base? (para estado vazio amigável) */
  hasAnyData: boolean
  revenuePeriod: Metric
  revenueTotal: number
  revenueTotalGrowth: number
  activeSubscribers: Metric
  signups: Metric
  conversion: Metric
  revocations: Metric
}

// ---- contadores de baixo nível (count/head: não trazem linhas) -------------

async function countSignups(
  admin: Admin,
  from: Date | null,
  to: Date | null
): Promise<number> {
  let q = admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  if (from) q = q.gte('created_at', from.toISOString())
  if (to) q = q.lt('created_at', to.toISOString())
  const { count } = await q
  return count ?? 0
}

async function countSales(
  admin: Admin,
  from: Date | null,
  to: Date | null
): Promise<number> {
  let q = admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('purchase_date', 'is', null)
  if (from) q = q.gte('purchase_date', from.toISOString())
  if (to) q = q.lt('purchase_date', to.toISOString())
  const { count } = await q
  return count ?? 0
}

/** Cadastros do período que viraram pagantes (conversão por coorte). */
async function countConvertedSignups(
  admin: Admin,
  from: Date | null,
  to: Date | null
): Promise<number> {
  let q = admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('purchase_date', 'is', null)
  if (from) q = q.gte('created_at', from.toISOString())
  if (to) q = q.lt('created_at', to.toISOString())
  const { count } = await q
  return count ?? 0
}

/**
 * Acesso ativo numa data de corte: pagantes ativos (purchase_date <= corte) +
 * cortesias válidas naquela data. `date = null` → snapshot "agora".
 * (Pode haver leve dupla contagem se alguém é pagante E cortesia — aceitável.)
 */
async function countActiveAsOf(admin: Admin, date: Date | null): Promise<number> {
  const cutoffIso = (date ?? new Date()).toISOString()

  let pq = admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')
    .not('purchase_date', 'is', null)
  if (date) pq = pq.lte('purchase_date', cutoffIso)
  const { count: payers } = await pq

  let cq = admin
    .from('complimentary_access')
    .select('*', { count: 'exact', head: true })
    .or(`revoked_at.is.null,revoked_at.gt.${cutoffIso}`)
    .or(`expires_at.is.null,expires_at.gt.${cutoffIso}`)
  if (date) cq = cq.lte('granted_at', cutoffIso)
  const { count: courtesies } = await cq

  return (payers ?? 0) + (courtesies ?? 0)
}

async function countRevocations(
  admin: Admin,
  from: Date | null,
  to: Date | null
): Promise<number> {
  let q = admin
    .from('complimentary_access')
    .select('*', { count: 'exact', head: true })
    .not('revoked_at', 'is', null)
  if (from) q = q.gte('revoked_at', from.toISOString())
  if (to) q = q.lt('revoked_at', to.toISOString())
  const { count } = await q
  return count ?? 0
}

// ---- agregação principal ---------------------------------------------------

export async function getAdminOverview(
  period: AdminPeriod
): Promise<AdminOverview> {
  const admin = createAdminClient()
  const { start, end, prevStart, prevEnd } = ranges(period)
  const price = COURSE_PRICE_CENTS / 100
  const hasComparison = prevStart !== null

  const [
    signups,
    signupsPrev,
    salesCount,
    salesPrev,
    salesTotal,
    activeNow,
    activePrev,
    convertedNow,
    convertedPrev,
    revocations,
    revocationsPrev,
    totalSignupsAll,
  ] = await Promise.all([
    countSignups(admin, start, end),
    hasComparison ? countSignups(admin, prevStart, prevEnd) : Promise.resolve(null),
    countSales(admin, start, end),
    hasComparison ? countSales(admin, prevStart, prevEnd) : Promise.resolve(null),
    countSales(admin, null, null),
    countActiveAsOf(admin, period === 'all' ? null : end),
    hasComparison ? countActiveAsOf(admin, prevEnd) : Promise.resolve(null),
    countConvertedSignups(admin, start, end),
    hasComparison
      ? countConvertedSignups(admin, prevStart, prevEnd)
      : Promise.resolve(null),
    countRevocations(admin, start, end),
    hasComparison ? countRevocations(admin, prevStart, prevEnd) : Promise.resolve(null),
    countSignups(admin, null, null),
  ])

  const conversionNow = signups > 0 ? (convertedNow / signups) * 100 : 0
  const conversionPrev =
    signupsPrev && signupsPrev > 0 && convertedPrev !== null
      ? (convertedPrev / signupsPrev) * 100
      : signupsPrev === null
        ? null
        : 0

  return {
    period,
    hasComparison,
    hasAnyData: totalSignupsAll > 0 || salesTotal > 0,
    revenuePeriod: {
      value: salesCount * price,
      previous: salesPrev !== null ? salesPrev * price : null,
    },
    revenueTotal: salesTotal * price,
    revenueTotalGrowth: salesCount * price,
    activeSubscribers: { value: activeNow, previous: activePrev },
    signups: { value: signups, previous: signupsPrev },
    conversion: { value: conversionNow, previous: conversionPrev },
    revocations: { value: revocations, previous: revocationsPrev },
  }
}

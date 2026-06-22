import { createAdminClient } from '@/lib/supabase/admin'
import { COURSE_PRICE_CENTS } from '@/lib/stripe/server'
import type { AdminPeriod } from '@/lib/admin/queries'
import { FUNCTIONS } from '@/lib/functions'

/**
 * Agregações de série temporal e distribuição para os gráficos do admin.
 * Server-only (service_role). Estratégia: buscar apenas as COLUNAS de data
 * necessárias dentro da janela e agrupar em JS por bucket (dia/semana/mês).
 * Volume hoje é baixo; se crescer, dá pra mover o group-by para um RPC com
 * date_trunc no Postgres sem mudar a interface destes tipos.
 */

type Admin = ReturnType<typeof createAdminClient>

const DAY = 86400000

interface Bucket {
  start: Date
  end: Date
  label: string
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
function monthLabel(d: Date): string {
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

/** Buckets uniformes (passo em dias) terminando em "agora". */
function uniformBuckets(count: number, stepDays: number): Bucket[] {
  const now = Date.now()
  const stepMs = stepDays * DAY
  const start = now - count * stepMs
  const buckets: Bucket[] = []
  for (let i = 0; i < count; i++) {
    const s = new Date(start + i * stepMs)
    buckets.push({
      start: s,
      end: new Date(start + (i + 1) * stepMs),
      label: dayLabel(s),
    })
  }
  return buckets
}

/** Buckets mensais do mês de `earliest` até o mês atual. */
function monthlyBuckets(earliest: Date): Bucket[] {
  const now = new Date()
  const buckets: Bucket[] = []
  const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1)
  // Limita a 24 meses para não explodir o eixo.
  let guard = 0
  while (cursor <= now && guard < 24) {
    const s = new Date(cursor)
    const e = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    buckets.push({ start: s, end: e, label: monthLabel(s) })
    cursor.setMonth(cursor.getMonth() + 1)
    guard++
  }
  return buckets.length ? buckets : [{ start: new Date(now.getFullYear(), now.getMonth(), 1), end: now, label: monthLabel(now) }]
}

async function buildBuckets(admin: Admin, period: AdminPeriod): Promise<Bucket[]> {
  if (period === '7d') return uniformBuckets(7, 1)
  if (period === '30d') return uniformBuckets(30, 1)
  if (period === '90d') return uniformBuckets(13, 7)
  // all → mensal a partir do 1º cadastro
  const { data } = await admin
    .from('profiles')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1)
  const earliest = data?.[0]?.created_at
    ? new Date(data[0].created_at as string)
    : new Date()
  return monthlyBuckets(earliest)
}

function assign(date: Date, buckets: Bucket[]): number {
  // pequeno volume → busca linear é suficiente
  for (let i = 0; i < buckets.length; i++) {
    if (date >= buckets[i].start && date < buckets[i].end) return i
  }
  // datas após o último end (agora) caem no último bucket
  if (buckets.length && date >= buckets[buckets.length - 1].start) {
    return buckets.length - 1
  }
  return -1
}

// ---- tipos de saída --------------------------------------------------------

export interface TimePoint {
  label: string
  revenue: number
  signups: number
  active: number
  cancellations: number
}

export interface FunnelData {
  visitors: number | null // null = ainda não rastreado
  signups: number
  payers: number
}

export interface DistributionSlice {
  key: string
  label: string
  count: number
}

export interface EngagementPoint {
  label: string
  answers: number
  returningUsers: number
}

export interface AdminCharts {
  timeSeries: TimePoint[]
  funnel: FunnelData
  distribution: DistributionSlice[]
  engagement: EngagementPoint[]
}

// ---- agregação principal ---------------------------------------------------

export async function getAdminCharts(period: AdminPeriod): Promise<AdminCharts> {
  const admin = createAdminClient()
  const buckets = await buildBuckets(admin, period)
  const price = COURSE_PRICE_CENTS / 100
  const windowStart = buckets[0]?.start ?? null
  const startIso = windowStart ? windowStart.toISOString() : null

  // Busca só as colunas de data, dentro da janela.
  const signupsQ = admin.from('profiles').select('created_at')
  const salesQ = admin
    .from('profiles')
    .select('purchase_date, target_function')
    .not('purchase_date', 'is', null)
  const revokesQ = admin
    .from('complimentary_access')
    .select('revoked_at')
    .not('revoked_at', 'is', null)
  const answersQ = admin.from('user_answers').select('attempted_at, user_id')

  if (startIso) {
    signupsQ.gte('created_at', startIso)
    salesQ.gte('purchase_date', startIso)
    revokesQ.gte('revoked_at', startIso)
    answersQ.gte('attempted_at', startIso)
  }

  const [signupsRes, salesRes, revokesRes, answersRes, salesBeforeRes] =
    await Promise.all([
      signupsQ,
      salesQ,
      revokesQ,
      answersQ,
      // pagantes ANTES da janela → base da linha de "ativos" acumulados
      startIso
        ? admin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .not('purchase_date', 'is', null)
            .lt('purchase_date', startIso)
        : Promise.resolve({ count: 0 }),
    ])

  const series: TimePoint[] = buckets.map((b) => ({
    label: b.label,
    revenue: 0,
    signups: 0,
    active: 0,
    cancellations: 0,
  }))

  for (const row of signupsRes.data ?? []) {
    const i = assign(new Date(row.created_at as string), buckets)
    if (i >= 0) series[i].signups++
  }
  const distMap = new Map<string, number>()
  for (const row of salesRes.data ?? []) {
    const i = assign(new Date(row.purchase_date as string), buckets)
    if (i >= 0) series[i].revenue += price
    const fn = (row.target_function as string | null) ?? 'undef'
    distMap.set(fn, (distMap.get(fn) ?? 0) + 1)
  }
  for (const row of revokesRes.data ?? []) {
    const i = assign(new Date(row.revoked_at as string), buckets)
    if (i >= 0) series[i].cancellations++
  }

  // Ativos acumulados: base (pagantes antes) + soma das vendas até o bucket.
  const base = (salesBeforeRes as { count: number | null }).count ?? 0
  let running = base
  for (const point of series) {
    running += point.revenue / price // nº de vendas do bucket
    point.active = running
  }

  // Funil do período: cadastros e pagantes (visitantes ainda não rastreados).
  const signupsTotal = (signupsRes.data ?? []).length
  const payersTotal = (salesRes.data ?? []).length
  const funnel: FunnelData = {
    visitors: null,
    signups: signupsTotal,
    payers: payersTotal,
  }

  // Distribuição por função (entre os pagantes do período).
  const distribution: DistributionSlice[] = FUNCTIONS.map((fn) => ({
    key: fn.code,
    label: fn.short,
    count: distMap.get(fn.code) ?? 0,
  }))
  const undef = distMap.get('undef') ?? 0
  if (undef > 0) {
    distribution.push({ key: 'undef', label: 'Não definida', count: undef })
  }

  // Engajamento: questões respondidas + usuários que voltam (distintos no bucket).
  const usersByBucket: Array<Set<string>> = buckets.map(() => new Set())
  const answersByBucket = new Array(buckets.length).fill(0)
  for (const row of answersRes.data ?? []) {
    const i = assign(new Date(row.attempted_at as string), buckets)
    if (i >= 0) {
      answersByBucket[i]++
      usersByBucket[i].add(row.user_id as string)
    }
  }
  const engagement: EngagementPoint[] = buckets.map((b, i) => ({
    label: b.label,
    answers: answersByBucket[i],
    returningUsers: usersByBucket[i].size,
  }))

  return { timeSeries: series, funnel, distribution, engagement }
}

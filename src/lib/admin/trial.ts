import { createAdminClient } from '@/lib/supabase/admin'
import type { TrialCargo, TrialStatus } from '@/lib/trial/types'

/**
 * Leads do diagnóstico gratuito para o admin. Server-only via service_role.
 *
 * Duas consultas em vez de um select aninhado: a FK de `free_trial_results`
 * aponta para `auth.users(id)`, não para `public.profiles(id)`, então o
 * PostgREST não enxerga relação entre as duas tabelas ("Could not find a
 * relationship"). O join sai aqui, em memória — o volume é de centenas.
 */

/** Módulo abaixo deste score entra em "dificuldades" (igual ao scoring). */
const LIMIAR_DIFICULDADE = 50

/** Teto de linhas carregadas — mesmo recorte usado no painel de abandonos. */
const LIMITE = 200

export interface TrialLeadRow {
  id: string
  full_name: string | null
  email: string
  whatsapp: string | null
  trial_cargo: TrialCargo | null
  trial_status: TrialStatus
  purchase_date: string | null
  created_at: string
  /** Nulos quando o lead se cadastrou mas não terminou o teste. */
  score_geral: number | null
  completed_at: string | null
  dificuldades: string[]
}

export interface TrialOverview {
  total: number
  completaram: number
  /** % de leads que terminaram o teste. */
  taxaConclusao: number
  /** Leads que viraram compra (purchase_date preenchido pelo webhook). */
  convertidos: number
  rows: TrialLeadRow[]
}

type ProfileRow = {
  id: string
  full_name: string | null
  email: string
  whatsapp: string | null
  trial_cargo: TrialCargo | null
  trial_status: TrialStatus
  purchase_date: string | null
  created_at: string
}

type ResultRow = {
  user_id: string
  score_geral: number | string | null
  score_por_modulo: Record<string, number> | null
  completed_at: string
}

function extrairDificuldades(
  scores: Record<string, number> | null,
): string[] {
  if (!scores) return []
  return Object.entries(scores)
    .filter(([, s]) => s < LIMIAR_DIFICULDADE)
    .map(([m]) => m)
}

export async function getTrialOverview(): Promise<TrialOverview> {
  const admin = createAdminClient()

  const { data: profilesData } = await admin
    .from('profiles')
    .select(
      'id, full_name, email, whatsapp, trial_cargo, trial_status, purchase_date, created_at',
    )
    .eq('is_trial', true)
    .order('created_at', { ascending: false })
    .limit(LIMITE)

  const profiles = (profilesData ?? []) as ProfileRow[]
  if (profiles.length === 0) {
    return { total: 0, completaram: 0, taxaConclusao: 0, convertidos: 0, rows: [] }
  }

  const { data: resultsData } = await admin
    .from('free_trial_results')
    .select('user_id, score_geral, score_por_modulo, completed_at')
    .in(
      'user_id',
      profiles.map((p) => p.id),
    )
    .order('completed_at', { ascending: false })

  // Ordenado por completed_at desc: o primeiro de cada usuário é o mais
  // recente, então quem refez o teste aparece com o resultado atual.
  const ultimoResultado = new Map<string, ResultRow>()
  for (const r of (resultsData ?? []) as ResultRow[]) {
    if (!ultimoResultado.has(r.user_id)) ultimoResultado.set(r.user_id, r)
  }

  const rows: TrialLeadRow[] = profiles.map((p) => {
    const r = ultimoResultado.get(p.id)
    return {
      ...p,
      // numeric(5,2) pode voltar como string do PostgREST.
      score_geral: r?.score_geral == null ? null : Number(r.score_geral),
      completed_at: r?.completed_at ?? null,
      dificuldades: extrairDificuldades(r?.score_por_modulo ?? null),
    }
  })

  // Quem terminou o teste sobe, ordenado pela data do teste; quem só se
  // cadastrou cai para baixo, pela data de cadastro.
  rows.sort(
    (a, b) =>
      new Date(b.completed_at ?? b.created_at).getTime() -
      new Date(a.completed_at ?? a.created_at).getTime(),
  )

  const total = rows.length
  const completaram = rows.filter((r) => r.completed_at !== null).length
  const convertidos = rows.filter((r) => r.purchase_date !== null).length

  return {
    total,
    completaram,
    taxaConclusao: total === 0 ? 0 : (completaram / total) * 100,
    convertidos,
    rows,
  }
}

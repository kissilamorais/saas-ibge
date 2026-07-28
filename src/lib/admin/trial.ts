import { createAdminClient } from '@/lib/supabase/admin'
import type { TrialCargo, TrialStatus } from '@/lib/trial/types'

/**
 * Leads do diagnóstico gratuito para o admin. Server-only via service_role.
 *
 * A fonte de dados é `trial_leads` (0013), não mais `profiles.is_trial`: desde
 * a correção da VUL-001 o teste gratuito não cria conta no Auth, então o lead
 * do funil só existe nessa tabela. Leads antigos (que tinham conta) foram
 * copiados para lá pelo backfill da própria migration.
 *
 * Duas consultas em vez de um select aninhado: mesma razão de antes — o join
 * sai aqui, em memória, e o volume é de centenas.
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
  /** Data da compra, casada por e-mail com `profiles`. Null = não comprou. */
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
  /** Leads que viraram compra (casamento por e-mail com profiles). */
  convertidos: number
  rows: TrialLeadRow[]
}

type LeadRow = {
  id: string
  full_name: string | null
  email: string
  whatsapp: string | null
  trial_cargo: TrialCargo | null
  trial_status: TrialStatus
  converted_at: string | null
  created_at: string
}

type ResultRow = {
  lead_id: string
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

  const { data: leadsData } = await admin
    .from('trial_leads')
    .select(
      'id, full_name, email, whatsapp, trial_cargo, trial_status, converted_at, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(LIMITE)

  const leads = (leadsData ?? []) as LeadRow[]
  if (leads.length === 0) {
    return { total: 0, completaram: 0, taxaConclusao: 0, convertidos: 0, rows: [] }
  }

  const { data: resultsData } = await admin
    .from('free_trial_results')
    .select('lead_id, score_geral, score_por_modulo, completed_at')
    .in(
      'lead_id',
      leads.map((l) => l.id),
    )
    .order('completed_at', { ascending: false })

  // Ordenado por completed_at desc: o primeiro de cada lead é o mais recente,
  // então quem refez o teste aparece com o resultado atual.
  const ultimoResultado = new Map<string, ResultRow>()
  for (const r of (resultsData ?? []) as ResultRow[]) {
    if (r.lead_id && !ultimoResultado.has(r.lead_id)) {
      ultimoResultado.set(r.lead_id, r)
    }
  }

  // Conversão é derivada de `profiles.purchase_date` casando por e-mail, e não
  // de `trial_leads.converted_at`: quem provisiona a conta paga é o guest.ts, e
  // ele não conhece a tabela de leads. Assim o KPI reflete a compra real mesmo
  // sem tocar no fluxo de pagamento. (converted_at fica reservado para quando
  // o webhook passar a marcar a conversão explicitamente.)
  const { data: compradoresData } = await admin
    .from('profiles')
    .select('email, purchase_date')
    .in(
      'email',
      leads.map((l) => l.email),
    )
    .not('purchase_date', 'is', null)

  const compraPorEmail = new Map(
    ((compradoresData ?? []) as { email: string; purchase_date: string }[]).map(
      (p) => [p.email.toLowerCase(), p.purchase_date],
    ),
  )

  const rows: TrialLeadRow[] = leads.map((l) => {
    const r = ultimoResultado.get(l.id)
    return {
      id: l.id,
      full_name: l.full_name,
      email: l.email,
      whatsapp: l.whatsapp,
      trial_cargo: l.trial_cargo,
      trial_status: l.trial_status,
      purchase_date:
        compraPorEmail.get(l.email.toLowerCase()) ?? l.converted_at ?? null,
      created_at: l.created_at,
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

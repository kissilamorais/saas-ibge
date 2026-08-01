import { NextResponse } from 'next/server'

import { getUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { reportError } from '@/lib/observability/log'

/**
 * GET /api/account/export — "baixar meus dados" (LGPD art. 18, portabilidade).
 *
 * Usa o client comum (RLS), não o service_role: cada query já vem restrita ao
 * dono, então não há como este endpoint vazar dado de outro usuário mesmo com
 * um bug de filtro — o próprio banco barra. Não inclui registros comerciais
 * (pending_orders, trial_leads, abandoned_checkouts) — são vínculo por e-mail,
 * não por user_id, e retidos por obrigação legal/fiscal (não fazem parte do
 * "meus dados" pessoais de estudo).
 */
export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const rl = await rateLimit('account-export', user.id, 5, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um instante.' },
      { status: 429 },
    )
  }

  const supabase = await createClient()

  const [profile, progress, answers, sessions, examResults, trialResults] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('user_progress').select('*').eq('user_id', user.id),
      supabase.from('user_answers').select('*').eq('user_id', user.id),
      supabase.from('study_sessions').select('*').eq('user_id', user.id),
      supabase.from('user_exam_results').select('*').eq('user_id', user.id),
      supabase.from('free_trial_results').select('*').eq('user_id', user.id),
    ])

  const firstError = [
    profile.error,
    progress.error,
    answers.error,
    sessions.error,
    examResults.error,
    trialResults.error,
  ].find(Boolean)

  if (firstError) {
    reportError('account.export', firstError, { userId: user.id })
    return NextResponse.json(
      { error: 'Não foi possível gerar sua exportação.' },
      { status: 500 },
    )
  }

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: profile.data,
    study_progress: progress.data,
    answers: answers.data,
    study_sessions: sessions.data,
    exam_results: examResults.data,
    free_trial_results: trialResults.data,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="meus-dados-aprovus.json"',
      'Cache-Control': 'private, no-store',
    },
  })
}

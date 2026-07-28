import { NextResponse, type NextRequest } from 'next/server'

import { clientIp, rateLimit } from '@/lib/rate-limit'
import { reportError } from '@/lib/observability/log'
import { createAdminClient } from '@/lib/supabase/admin'
import { createTrialSession, getTrialSessionFromRequest } from '@/lib/trial-session'
import { isTrialCargo } from '@/lib/trial/types'
import type { FunctionCode } from '@/types'

/**
 * POST /api/trial/cargo — grava o cargo escolhido no lead do teste.
 *
 * Existe como rota (e não como escrita direta do <CargoPicker>, como era antes)
 * por dois motivos: `trial_leads` está atrás do RLS sem policy pública — só o
 * service_role escreve —, e o cookie da sessão de convidado precisa ser
 * reemitido com o cargo, o que só é possível numa response.
 *
 * Grava as duas grafias do mesmo valor: `trial_cargo` ('ACA') segmenta o funil
 * no painel; `target_function` ('aca') é a trilha que o dashboard lê depois da
 * compra.
 */
export async function POST(request: NextRequest) {
  const rl = await rateLimit('trial-cargo', clientIp(request), 20, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um instante.' },
      { status: 429 },
    )
  }

  const session = await getTrialSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as {
    cargo?: unknown
  } | null

  if (!isTrialCargo(body?.cargo)) {
    return NextResponse.json({ error: 'Cargo inválido.' }, { status: 400 })
  }

  const cargo = body.cargo
  const targetFunction = cargo.toLowerCase() as FunctionCode

  const { error } = await createAdminClient()
    .from('trial_leads')
    .update({ trial_cargo: cargo, target_function: targetFunction })
    .eq('id', session.leadId)

  if (error) {
    reportError('trial.cargo.update', error, { leadId: session.leadId })
    return NextResponse.json(
      { error: 'Não foi possível salvar sua escolha. Tente de novo.' },
      { status: 500 },
    )
  }

  const response = NextResponse.json({ ok: true })
  // Reemite o cookie com o cargo — é ele que /teste/questoes lê para montar o
  // diagnóstico, sem uma consulta a mais por render.
  await createTrialSession(
    { ...session, cargo, targetFunction },
    response,
  )

  return response
}

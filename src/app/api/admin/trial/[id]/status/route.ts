import { NextResponse } from 'next/server'

import { isAdmin } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { isTrialStatus } from '@/lib/trial/types'

/**
 * PATCH /api/admin/trial/[id]/status — muda o estágio do lead no mini-CRM.
 *
 * `[id]` é o id do lead em `trial_leads` (0013), não mais o do profile: desde a
 * correção da VUL-001 o teste gratuito não cria conta no Auth. A tabela está
 * atrás de RLS sem policy nenhuma, então a escrita só existe via service_role —
 * e o guard de admin é feito aqui, no servidor, antes de qualquer escrita.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    // 404, não 403 — mesmo critério do requireAdmin: não confirma a existência
    // do painel para quem não é admin.
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  const body = (await request.json().catch(() => null)) as {
    trial_status?: unknown
  } | null

  if (!isTrialStatus(body?.trial_status)) {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
  }

  const { error } = await createAdminClient()
    .from('trial_leads')
    .update({ trial_status: body.trial_status })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json(
      { error: 'Não foi possível salvar o status.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}

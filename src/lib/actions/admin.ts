'use server'

import { revalidatePath } from 'next/cache'

import { requireAdmin } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LeadFollowupStatus } from '@/types'

const VALID_STATUS: LeadFollowupStatus[] = [
  'none',
  'contacted',
  'converted',
  'lost',
]

/**
 * Atualiza o follow-up de um lead (status + nota). Admin-only e via service_role
 * — as colunas lead_followup_* têm UPDATE revogado de authenticated (0008), só
 * o servidor as altera.
 */
export async function setLeadFollowup(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('leadId') ?? '')
  const status = String(formData.get('status') ?? '') as LeadFollowupStatus
  const noteRaw = String(formData.get('note') ?? '').trim()

  if (!id || !VALID_STATUS.includes(status)) return

  const admin = createAdminClient()
  await admin
    .from('profiles')
    .update({
      lead_followup_status: status,
      lead_followup_note: noteRaw || null,
      lead_followup_at: new Date().toISOString(),
    })
    .eq('id', id)

  revalidatePath('/admin/leads')
  revalidatePath(`/admin/leads/${id}`)
}

// ---- Cortesia de parceiro --------------------------------------------------

export type ActionState = { ok: boolean; message: string } | null

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Concede acesso de cortesia a um e-mail. Vale na hora se a pessoa já tem conta;
 * caso contrário, passa a valer quando ela se cadastrar com esse e-mail (o gate
 * casa por e-mail). Para useFormState (retorna estado de sucesso/erro).
 */
export async function grantComplimentary(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin()

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const note = String(formData.get('note') ?? '').trim()
  const expiresRaw = String(formData.get('expires_at') ?? '').trim()

  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: 'Informe um e-mail válido.' }
  }

  const expires_at = expiresRaw
    ? new Date(`${expiresRaw}T23:59:59`).toISOString()
    : null

  const client = createAdminClient()
  const { error } = await client.from('complimentary_access').insert({
    email,
    note: note || null,
    expires_at,
    granted_by: admin.id,
  })

  if (error) {
    // 23505 = índice único parcial (já existe cortesia ATIVA para o e-mail).
    if (error.code === '23505') {
      return {
        ok: false,
        message: 'Esse e-mail já tem uma cortesia ativa.',
      }
    }
    return { ok: false, message: 'Não foi possível conceder. Tente de novo.' }
  }

  revalidatePath('/admin/partners')
  return { ok: true, message: `Cortesia concedida a ${email}.` }
}

/** Revoga uma cortesia (marca revoked_at). Admin-only. */
export async function revokeComplimentary(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const client = createAdminClient()
  await client
    .from('complimentary_access')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin/partners')
}

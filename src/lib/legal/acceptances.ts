import { createAdminClient } from '@/lib/supabase/admin'
import { reportError } from '@/lib/observability/log'

/**
 * Registro de aceite eletrônico (VUL-A03). Grava QUEM aceitou QUAL versão de
 * QUAL documento, com IP/UA — é a prova de aceite que falta hoje para
 * qualquer disputa de chargeback ou reclamação de PROCON.
 *
 * Ainda NÃO está conectado a nenhum checkbox de UI: os documentos
 * (/termos, /privacidade, /cookies) precisam de texto revisado por advogado
 * antes de existir algo real para aceitar (ver AUDITORIA-2026-07-31.md,
 * VUL-A03 itens 1 e 4). Quando essas páginas existirem, chame esta função no
 * submit do checkout/signup passando a versão publicada.
 *
 * Nunca lança: falha ao registrar aceite não pode travar o fluxo de compra —
 * mas é reportada, porque um aceite não registrado é o próprio problema que
 * esta tabela existe para evitar.
 */
export type LegalDocument = 'terms' | 'privacy' | 'refund' | 'cookies'

export interface RecordLegalAcceptanceInput {
  email: string
  document: LegalDocument
  version: string
  ip?: string | null
  userAgent?: string | null
  userId?: string | null
}

export async function recordLegalAcceptance(
  input: RecordLegalAcceptanceInput,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('legal_acceptances').insert({
    email: input.email.toLowerCase().trim(),
    document: input.document,
    version: input.version,
    ip: input.ip ?? null,
    user_agent: input.userAgent ?? null,
    user_id: input.userId ?? null,
  })
  if (error) {
    reportError('legal.record_acceptance', error, {
      document: input.document,
      version: input.version,
    })
  }
}

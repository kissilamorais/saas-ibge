import { createAdminClient } from '@/lib/supabase/admin'
import { reportError } from '@/lib/observability/log'
import type { Json } from '@/types'

/**
 * Registra uma ação administrativa (0018). Nunca lança: uma falha ao gravar o
 * log não pode travar a ação em si (ex.: conceder uma cortesia continua
 * valendo mesmo se o log falhar) — mas é reportada, porque um log que devia
 * existir e não existe é o próprio problema que esta tabela existe pra evitar.
 */
export async function logAdminAction(
  admin: { id: string; email: string },
  action: string,
  target?: string | null,
  details?: Record<string, unknown> | null,
): Promise<void> {
  const client = createAdminClient()
  const { error } = await client.from('admin_audit_log').insert({
    admin_id: admin.id,
    admin_email: admin.email,
    action,
    target: target ?? null,
    details: (details ?? null) as Json | null,
  })
  if (error) {
    reportError('admin.audit_log', error, { action, target: target ?? undefined })
  }
}

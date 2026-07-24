import { NextResponse } from 'next/server'

import { resolveBonusAccess } from '@/lib/bonuses/access'
import { BONUS_STORAGE_BUCKET } from '@/lib/bonuses/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { reportError } from '@/lib/observability/log'

/**
 * Entrega gated do recurso real de um bônus (PDF do edital, suporte por e-mail).
 *
 * A checagem de acesso é REFEITA aqui no servidor — pagamento + janela temporal
 * (resolveBonusAccess) — para que o arquivo/URL real nunca vaze no bundle do
 * cliente nem seja acessível por URL antes da hora. Esconder no front é só UX;
 * este é o gate de verdade.
 *
 * Downloads: o arquivo mora num bucket PRIVADO do Supabase Storage e é servido
 * como STREAM de bytes com service_role (nunca um redirect para URL pública) —
 * assim não há caminho para baixá-lo sem passar por este gate.
 *
 * Respostas:
 *   404 — slug inexistente.
 *   403 — sem acesso (não pagou ou ainda não desbloqueou no tempo).
 *   404 — desbloqueado, mas o recurso ainda não foi disponibilizado.
 *   200 — bytes do arquivo (download) OU 302 para o recurso (external).
 */
export async function GET(
  _req: Request,
  { params }: { params: { bonusSlug: string } },
) {
  const { bonus, canAccess } = await resolveBonusAccess(params.bonusSlug)

  if (!bonus) {
    return NextResponse.json({ error: 'Bônus não encontrado' }, { status: 404 })
  }

  if (!canAccess) {
    // Não revela se o bloqueio é por pagamento ou por tempo — só nega.
    return NextResponse.json({ error: 'Acesso não liberado' }, { status: 403 })
  }

  // Download: stream dos bytes a partir do bucket privado (service_role).
  if (bonus.delivery === 'download') {
    if (!bonus.storagePath) {
      return NextResponse.json(
        { error: 'Recurso ainda não disponível' },
        { status: 404 },
      )
    }

    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(BONUS_STORAGE_BUCKET)
      .download(bonus.storagePath)

    if (error || !data) {
      reportError('bonus.download', error ?? new Error('storage retornou vazio'), {
        slug: bonus.slug,
        path: bonus.storagePath,
      })
      return NextResponse.json(
        { error: 'Não foi possível carregar o material.' },
        { status: 502 },
      )
    }

    const filename = bonus.storagePath.split('/').pop() || 'material'
    const bytes = await data.arrayBuffer()
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentTypeFor(filename),
        'Content-Disposition': `attachment; filename="${filename}"`,
        // Conteúdo pago e por-usuário: nunca cachear em CDN/proxy compartilhado.
        'Cache-Control': 'private, no-store',
      },
    })
  }

  // Demais entregas (external): redireciona para o recurso real.
  if (!bonus.resourceUrl) {
    return NextResponse.json(
      { error: 'Recurso ainda não disponível' },
      { status: 404 },
    )
  }
  return NextResponse.redirect(bonus.resourceUrl, { status: 302 })
}

/** MIME por extensão. Hoje só PDF; default seguro para binário genérico. */
function contentTypeFor(filename: string): string {
  if (filename.toLowerCase().endsWith('.pdf')) return 'application/pdf'
  return 'application/octet-stream'
}

import { NextResponse } from 'next/server'

import { resolveBonusAccess } from '@/lib/bonuses/access'

/**
 * Entrega gated do recurso real de um bônus (PDF do edital, convite do Telegram).
 *
 * A checagem de acesso é REFEITA aqui no servidor — pagamento + janela temporal
 * (resolveBonusAccess) — para que o link/arquivo real nunca vaze no bundle do
 * cliente nem seja acessível por URL antes da hora. Esconder no front é só UX;
 * este é o gate de verdade.
 *
 * Respostas:
 *   404 — slug inexistente.
 *   403 — sem acesso (não pagou ou ainda não desbloqueou no tempo).
 *   404 — desbloqueado, mas o recurso ainda não foi disponibilizado (placeholder).
 *   302 — redireciona para o recurso real (quando `resourceUrl` estiver definido).
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

  // Desbloqueado, mas conteúdo real ainda não cadastrado (será fornecido depois).
  if (!bonus.resourceUrl) {
    return NextResponse.json(
      { error: 'Recurso ainda não disponível' },
      { status: 404 },
    )
  }

  return NextResponse.redirect(bonus.resourceUrl, { status: 302 })
}

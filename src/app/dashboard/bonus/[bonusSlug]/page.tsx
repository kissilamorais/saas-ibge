import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download, Lock, Send } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { requireActiveSubscription } from '@/lib/auth/session'
import { getBonus } from '@/lib/bonuses/config'
import { isUnlocked, daysUntilUnlock, unlockDate, formatUnlockDate } from '@/lib/bonuses/unlock'

/**
 * Página de um bônus. Gate em DUAS camadas, no servidor:
 *   1. requireActiveSubscription() — pagamento (redireciona p/ /checkout se não pago).
 *   2. isUnlocked() — janela temporal; se ainda não abriu, renderiza estado
 *      bloqueado e NUNCA o conteúdo/URL real.
 *
 * O conteúdo real ainda não existe (será fornecido depois). Por ora: placeholders
 * na página e, para edital/telegram, um botão que aponta para /api/bonus/[slug]
 * — que revalida o acesso do lado do servidor antes de servir o recurso.
 */
export default async function BonusPage({
  params,
}: {
  params: { bonusSlug: string }
}) {
  const bonus = getBonus(params.bonusSlug)
  if (!bonus) notFound()

  // 1) Pagamento. Redireciona para /checkout se não houver acesso pago.
  const profile = await requireActiveSubscription()
  const purchaseDate = profile.purchase_date ?? null
  const Icon = bonus.icon

  // 2) Tempo.
  const unlocked = isUnlocked(bonus, purchaseDate)

  if (!unlocked) {
    const days = daysUntilUnlock(bonus, purchaseDate)
    const on = unlockDate(bonus, purchaseDate)
    const quando =
      days === null
        ? 'Este bônus abre após a confirmação da sua compra.'
        : days === 0
          ? 'Este bônus abre ainda hoje.'
          : `Este bônus abre em ${days === 1 ? '1 dia' : `${days} dias`}${
              on ? `, em ${formatUnlockDate(on)}` : ''
            }.`

    return (
      <div className="space-y-6 p-6 md:p-8">
        <BackLink />
        <PageHeader eyebrow="Bônus" title={bonus.title} description={bonus.description} />
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <p className="font-medium">Ainda não liberado</p>
            <p className="max-w-md text-sm text-muted-foreground">{quando}</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voltar ao dashboard
          </Link>
        </Card>
      </div>
    )
  }

  // Liberado: entrega por tipo. Conteúdo real virá depois — placeholders abaixo.
  return (
    <div className="space-y-6 p-6 md:p-8">
      <BackLink />
      <PageHeader
        eyebrow="Bônus liberado"
        title={bonus.title}
        description={bonus.description}
      />

      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted-foreground">
            {/* TODO(conteúdo): substituir o placeholder pelo conteúdo real do bônus. */}
            Conteúdo em preparação. Assim que estiver pronto, aparece aqui.
          </p>
        </div>

        {bonus.delivery === 'download' && (
          <a
            href={`/api/bonus/${bonus.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Download className="h-4 w-4" />
            Baixar material
          </a>
        )}

        {bonus.delivery === 'external' && (
          <a
            href={`/api/bonus/${bonus.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Send className="h-4 w-4" />
            Entrar no grupo
          </a>
        )}
      </Card>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Dashboard
    </Link>
  )
}

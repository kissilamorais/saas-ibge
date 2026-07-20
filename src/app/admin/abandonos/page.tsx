import { ShoppingCart, TrendingUp, Undo2, Wallet } from 'lucide-react'

import { requireAdmin } from '@/lib/auth/session'
import { getAbandonedOverview, isRecoveryLinkUsable } from '@/lib/admin/abandoned'
import { formatBRL, formatDate, formatInt, formatPct } from '@/lib/admin/format'
import { KpiCard } from '@/components/admin/KpiCard'
import { CopyLinkButton } from '@/components/admin/CopyLinkButton'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PromoConsentStatus } from '@/types'

export const metadata = { title: 'Abandonos · Admin · Aprovus' }
export const dynamic = 'force-dynamic'

/**
 * Consentimento promocional. NULL não é recusa — a Stripe só exibe a caixa
 * quando empresa e cliente estão nos EUA, então em BR vem sempre null.
 */
function ConsentBadge({ status }: { status: PromoConsentStatus }) {
  if (status === 'opt_in') return <Badge variant="success">Aceitou</Badge>
  if (status === 'opt_out') return <Badge variant="destructive">Recusou</Badge>
  return <Badge variant="muted">Não coletado</Badge>
}

export default async function AdminAbandonedPage() {
  await requireAdmin()
  const data = await getAbandonedOverview()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Checkouts abandonados
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem iniciou o pagamento e não concluiu. O contato é manual: copie o
          link de recuperação e envie junto com o cupom.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Abandonos"
          value={formatInt(data.total)}
          icon={ShoppingCart}
          subtitle="sessões expiradas sem pagar"
        />
        <KpiCard
          title="Recuperados"
          value={formatInt(data.recovered)}
          icon={Undo2}
          subtitle="viraram compra depois"
        />
        <KpiCard
          title="Taxa de recuperação"
          value={formatPct(data.recoveryRate)}
          icon={TrendingUp}
          subtitle="recuperados / abandonos"
        />
        <KpiCard
          title="Valor em aberto"
          value={formatBRL(data.pendingValueCents / 100)}
          icon={Wallet}
          subtitle="soma dos não recuperados"
        />
      </section>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Lista de abandonos
          </CardTitle>
          <CardDescription>
            {data.rows.length === 0
              ? 'Nenhum abandono registrado ainda.'
              : `Mostrando os ${data.rows.length} mais recentes.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {data.rows.length === 0 ? (
            <div className="mx-6 flex h-32 items-center justify-center rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground">
              Os abandonos aparecem aqui quando uma sessão de checkout expira
              sem pagamento — o que leva cerca de 24h após a tentativa.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pessoa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Abandonou em</TableHead>
                    <TableHead>Consentimento</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Recuperação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row) => {
                    const linkUsable = isRecoveryLinkUsable(row)
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {row.full_name || '—'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.email}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.amount_cents === null
                            ? '—'
                            : formatBRL(row.amount_cents / 100)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(row.expired_at)}
                        </TableCell>
                        <TableCell>
                          <ConsentBadge status={row.consent_status} />
                        </TableCell>
                        <TableCell>
                          {row.recovered_at ? (
                            <Badge variant="success">
                              Recuperado em {formatDate(row.recovered_at)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Em aberto</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.recovered_at ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : linkUsable ? (
                            <CopyLinkButton url={row.recovery_url as string} />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {row.recovery_url
                                ? 'Link expirado'
                                : 'Sem link'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        O link de recuperação abre uma nova sessão de checkout, cópia da
        original, com campo de cupom habilitado. “Não coletado” no consentimento
        é o normal no Brasil — a Stripe só coleta essa permissão quando empresa
        e cliente estão nos EUA, e isso não impede o contato manual.
      </p>
    </div>
  )
}

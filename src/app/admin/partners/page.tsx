import { requireAdmin } from '@/lib/auth/session'
import { getPartnersOverview, type CourtesyStatus } from '@/lib/admin/partners'
import { formatDate } from '@/lib/admin/format'
import { PartnerGrantForm } from '@/components/admin/PartnerGrantForm'
import { RevokeButton } from '@/components/admin/RevokeButton'
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

export const metadata = { title: 'Parceiros · Admin · Aprovus' }
export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<
  CourtesyStatus,
  { label: string; variant: 'success' | 'muted' | 'destructive' }
> = {
  active: { label: 'Ativa', variant: 'success' },
  expired: { label: 'Expirada', variant: 'muted' },
  revoked: { label: 'Revogada', variant: 'destructive' },
}

export default async function AdminPartnersPage() {
  await requireAdmin()
  const { activeCount, rows } = await getPartnersOverview()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Acesso de parceiros
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conceda acesso grátis a um e-mail. Vale junto da assinatura paga no
          gate de conteúdo — e passa a valer automaticamente quando a pessoa se
          cadastrar com esse e-mail. {activeCount} cortesia(s) ativa(s).
        </p>
      </header>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Conceder cortesia
          </CardTitle>
          <CardDescription>
            O e-mail não precisa ter conta ainda. Validade é opcional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PartnerGrantForm />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Cortesias concedidas
          </CardTitle>
          <CardDescription>
            {rows.length === 0
              ? 'Nenhuma cortesia ainda.'
              : `${rows.length} registro(s), mais recentes primeiro.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {rows.length === 0 ? (
            <div className="mx-6 flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Conceda a primeira cortesia no formulário acima.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Quem é</TableHead>
                  <TableHead>Concedida</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-foreground">
                      {r.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.note || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(r.granted_at)}
                      {r.grantedByEmail && (
                        <span className="block text-xs">
                          por {r.grantedByEmail}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.expires_at ? formatDate(r.expires_at) : 'Sem validade'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.hasAccount ? 'secondary' : 'muted'}>
                        {r.hasAccount ? 'Tem conta' : 'Aguardando'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[r.status].variant}>
                        {STATUS_BADGE[r.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === 'active' ? (
                        <RevokeButton id={r.id} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

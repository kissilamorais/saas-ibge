import Link from 'next/link'
import { Percent, Timer, UserPlus, Users } from 'lucide-react'

import { requireAdmin } from '@/lib/auth/session'
import { getLeadsOverview } from '@/lib/admin/leads'
import { formatDate, formatDays, formatInt, formatPct } from '@/lib/admin/format'
import { KpiCard } from '@/components/admin/KpiCard'
import { LeadStatusBadge } from '@/components/admin/LeadStatusBadge'
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
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Leads · Admin · Aprovus' }
export const dynamic = 'force-dynamic'

export default async function AdminLeadsPage() {
  await requireAdmin()
  const data = await getLeadsOverview()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Leads
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem se cadastrou mas ainda não comprou. Métricas e dados são reais.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total de leads"
          value={formatInt(data.totalLeads)}
          icon={Users}
          subtitle="ainda não pagantes"
        />
        <KpiCard
          title="Conversão lead → pago"
          value={formatPct(data.conversion)}
          icon={Percent}
          subtitle="pagantes / cadastros"
        />
        <KpiCard
          title="Tempo médio até converter"
          value={formatDays(data.avgDaysToConvert)}
          icon={Timer}
          subtitle="entre os pagantes"
        />
        <KpiCard
          title="Pagantes (total)"
          value={formatInt(data.totalPayers)}
          icon={UserPlus}
          subtitle="acumulado"
        />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Tabela de leads */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Lista de leads
            </CardTitle>
            <CardDescription>
              {data.leads.length === 0
                ? 'Nenhum lead ainda.'
                : `Mostrando os ${data.leads.length} mais recentes.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {data.leads.length === 0 ? (
              <div className="mx-6 flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Os leads aparecem aqui conforme as pessoas se cadastram.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {lead.full_name || '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lead.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(lead.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.utm_source?.trim() || 'Direto'}
                        {lead.utm_campaign && (
                          <span className="block text-xs">
                            {lead.utm_campaign}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.lead_followup_status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/leads/${lead.id}`}>Detalhes</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Leads por origem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Leads por origem
            </CardTitle>
            <CardDescription>UTM source do cadastro.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byOrigin.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.byOrigin.map((o) => (
                  <li
                    key={o.source}
                    className="flex items-center justify-between"
                  >
                    <span className="text-muted-foreground">{o.source}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatInt(o.count)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Origem passa a ser registrada nos novos cadastros (via UTM no
              link). Leads antigos aparecem como “Direto”.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { requireAdmin } from '@/lib/auth/session'
import { getLead } from '@/lib/admin/leads'
import { setLeadFollowup } from '@/lib/actions/admin'
import { formatDate } from '@/lib/admin/format'
import {
  LeadStatusBadge,
  LEAD_STATUS_OPTIONS,
} from '@/components/admin/LeadStatusBadge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export const metadata = { title: 'Detalhe do lead · Admin · Aprovus' }
export const dynamic = 'force-dynamic'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()
  const lead = await getLead(params.id)
  if (!lead) notFound()

  const isPayer = !!lead.purchase_date

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/admin/leads">
          <ArrowLeft className="h-4 w-4" />
          Voltar aos leads
        </Link>
      </Button>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {lead.full_name || lead.email}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{lead.email}</p>
        </div>
        <LeadStatusBadge status={lead.lead_followup_status} />
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Cadastro</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Field label="Data de cadastro" value={formatDate(lead.created_at)} />
            <Field
              label="Situação"
              value={isPayer ? 'Pagante' : 'Lead (não pagou)'}
            />
            <Field
              label="Compra"
              value={isPayer ? formatDate(lead.purchase_date) : '—'}
            />
            <Field
              label="Trilha (cargo)"
              value={lead.target_function?.toUpperCase() || 'Não escolhida'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Origem</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Field label="UTM source" value={lead.utm_source || 'Direto'} />
            <Field label="UTM medium" value={lead.utm_medium || '—'} />
            <Field label="Campanha" value={lead.utm_campaign || '—'} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Follow-up</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={setLeadFollowup} className="space-y-4">
            <input type="hidden" name="leadId" value={lead.id} />

            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={lead.lead_followup_status}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LEAD_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">Nota</Label>
              <textarea
                id="note"
                name="note"
                defaultValue={lead.lead_followup_note ?? ''}
                rows={3}
                placeholder="Ex.: enviei e-mail em 22/06, aguardando resposta."
                className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {lead.lead_followup_at
                  ? `Atualizado em ${formatDate(lead.lead_followup_at)}`
                  : 'Sem follow-up registrado ainda.'}
              </span>
              <Button type="submit">Salvar follow-up</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

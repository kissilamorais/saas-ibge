import { CheckCircle2, ClipboardList, MessageCircle, TrendingUp, Users } from 'lucide-react'

import { requireAdmin } from '@/lib/auth/session'
import { getTrialOverview, type TrialLeadRow } from '@/lib/admin/trial'
import { formatDateTime, formatInt, formatPct } from '@/lib/admin/format'
import { CopyLinkButton } from '@/components/admin/CopyLinkButton'
import { KpiCard } from '@/components/admin/KpiCard'
import { TrialStatusSelect } from '@/components/admin/TrialStatusSelect'
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

export const metadata = { title: 'Trial · Admin · Aprovus' }
export const dynamic = 'force-dynamic'

/** Score colorido pela faixa do diagnóstico (mesmos cortes do scoring). */
function ScoreCell({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-muted-foreground">—</span>
  }
  const cor =
    score >= 70 ? 'text-primary' : score >= 45 ? 'text-gold' : 'text-destructive'
  return <span className={`font-semibold tabular-nums ${cor}`}>{score}%</span>
}

/**
 * Link de WhatsApp. O número é gravado só com dígitos, mas limpamos de novo
 * aqui: contas antigas podem ter vindo formatadas do metadata do signup.
 */
function WhatsAppCell({ numero }: { numero: string | null }) {
  const digitos = numero?.replace(/\D/g, '') ?? ''
  if (!digitos) return <span className="text-muted-foreground">—</span>

  return (
    <a
      href={`https://wa.me/55${digitos}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-foreground underline-offset-2 hover:text-primary hover:underline"
    >
      <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {numero}
    </a>
  )
}

function LinhaLead({ lead }: { lead: TrialLeadRow }) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {lead.full_name?.trim() || (
          <span className="text-muted-foreground">Sem nome</span>
        )}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-sm">{lead.email}</span>
          <CopyLinkButton url={lead.email} label="Copiar" />
        </div>
      </TableCell>

      <TableCell>
        <WhatsAppCell numero={lead.whatsapp} />
      </TableCell>

      <TableCell>
        {lead.trial_cargo ? (
          <Badge variant="secondary">{lead.trial_cargo}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        <ScoreCell score={lead.score_geral} />
      </TableCell>

      <TableCell className="max-w-56 text-sm text-muted-foreground">
        {lead.completed_at === null
          ? '—'
          : lead.dificuldades.length === 0
            ? 'Nenhuma'
            : lead.dificuldades.join(', ')}
      </TableCell>

      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {formatDateTime(lead.completed_at)}
      </TableCell>

      <TableCell>
        <TrialStatusSelect leadId={lead.id} statusInicial={lead.trial_status} />
      </TableCell>
    </TableRow>
  )
}

export default async function AdminTrialPage() {
  await requireAdmin()
  const data = await getTrialOverview()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Diagnóstico gratuito
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem entrou pelo teste de 10 questões. O contato é manual: use o
          WhatsApp e marque o estágio para não abordar a mesma pessoa duas vezes.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Leads"
          value={formatInt(data.total)}
          icon={Users}
          subtitle="contas criadas pelo teste"
        />
        <KpiCard
          title="Completaram"
          value={formatInt(data.completaram)}
          icon={ClipboardList}
          subtitle="terminaram as 10 questões"
        />
        <KpiCard
          title="Taxa de conclusão"
          value={formatPct(data.taxaConclusao)}
          icon={TrendingUp}
          subtitle="completaram / leads"
        />
        <KpiCard
          title="Convertidos"
          value={formatInt(data.convertidos)}
          icon={CheckCircle2}
          subtitle="compraram de fato"
        />
      </section>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Leads do teste
          </CardTitle>
          <CardDescription>
            {data.rows.length === 0
              ? 'Nenhum lead do diagnóstico ainda.'
              : `Mostrando os ${data.rows.length} mais recentes. Quem completou o teste aparece primeiro.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.rows.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Dificuldades</TableHead>
                    <TableHead>Teste</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((lead) => (
                    <LinhaLead key={lead.id} lead={lead} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

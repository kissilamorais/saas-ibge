import {
  RotateCcw,
  TrendingUp,
  UserCheck,
  UserPlus,
  Wallet,
  Wallet2,
} from 'lucide-react'

import { requireAdmin } from '@/lib/auth/session'
import {
  getAdminOverview,
  PERIOD_LABEL,
  resolvePeriod,
} from '@/lib/admin/queries'
import { getAdminCharts } from '@/lib/admin/charts'
import {
  formatBRL,
  formatInt,
  formatPct,
  pointsDelta,
  relativeDelta,
} from '@/lib/admin/format'
import { KpiCard } from '@/components/admin/KpiCard'
import { PeriodFilter } from '@/components/admin/PeriodFilter'
import { ChartCard } from '@/components/admin/charts/ChartCard'
import { RevenueChart } from '@/components/admin/charts/RevenueChart'
import { SignupsChart } from '@/components/admin/charts/SignupsChart'
import { ActiveCancelChart } from '@/components/admin/charts/ActiveCancelChart'
import { FunnelChart } from '@/components/admin/charts/FunnelChart'
import { FunctionDistributionChart } from '@/components/admin/charts/FunctionDistributionChart'
import { EngagementChart } from '@/components/admin/charts/EngagementChart'

export const metadata = { title: 'Visão geral · Admin · Aprovus' }

// Dados sempre frescos: métricas mudam a cada cadastro/venda.
export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  await requireAdmin()
  const period = resolvePeriod(searchParams.period)
  const [data, charts] = await Promise.all([
    getAdminOverview(period),
    getAdminCharts(period),
  ])
  const vsPrev = data.hasComparison ? 'vs. período anterior' : PERIOD_LABEL[period]

  const noRevenue = charts.timeSeries.every((p) => p.revenue === 0)
  const noSignups = charts.timeSeries.every((p) => p.signups === 0)
  const noActivity = charts.timeSeries.every(
    (p) => p.active === 0 && p.cancellations === 0
  )
  const noDistribution = charts.distribution.every((d) => d.count === 0)
  const noEngagement = charts.engagement.every(
    (p) => p.answers === 0 && p.returningUsers === 0
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Visão geral
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Métricas de {PERIOD_LABEL[period]}.
            {data.hasComparison && ' Comparação com o período anterior.'}
          </p>
        </div>
        <PeriodFilter period={period} />
      </header>

      {!data.hasAnyData && (
        <div className="mt-6 rounded-lg border border-dashed bg-card px-4 py-3 text-sm text-muted-foreground">
          Ainda não há cadastros nem vendas. Os números vão aparecer aqui
          conforme os alunos chegam — os dados abaixo são reais (não exemplos).
        </div>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Receita no período"
          value={formatBRL(data.revenuePeriod.value)}
          icon={Wallet}
          delta={relativeDelta(
            data.revenuePeriod.value,
            data.revenuePeriod.previous
          )}
          subtitle={vsPrev}
        />
        <KpiCard
          title="Receita total"
          value={formatBRL(data.revenueTotal)}
          icon={Wallet2}
          subtitle={
            data.revenueTotalGrowth > 0
              ? `+${formatBRL(data.revenueTotalGrowth)} no período`
              : 'acumulado (vitalício)'
          }
        />
        <KpiCard
          title="Assinantes ativos"
          value={formatInt(data.activeSubscribers.value)}
          icon={UserCheck}
          delta={relativeDelta(
            data.activeSubscribers.value,
            data.activeSubscribers.previous
          )}
          subtitle="pagantes + cortesias válidas"
        />
        <KpiCard
          title="Novos cadastros"
          value={formatInt(data.signups.value)}
          icon={UserPlus}
          delta={relativeDelta(data.signups.value, data.signups.previous)}
          subtitle={vsPrev}
        />
        <KpiCard
          title="Conversão lead → pagante"
          value={formatPct(data.conversion.value)}
          icon={TrendingUp}
          delta={pointsDelta(data.conversion.value, data.conversion.previous)}
          subtitle={vsPrev}
        />
        <KpiCard
          title="Acessos revogados"
          value={formatInt(data.revocations.value)}
          icon={RotateCcw}
          delta={relativeDelta(data.revocations.value, data.revocations.previous)}
          goodWhenUp={false}
          subtitle="cortesias revogadas no período"
        />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Receita ao longo do tempo"
          description={`Vendas × R$97 por ${period === '90d' ? 'semana' : period === 'all' ? 'mês' : 'dia'}.`}
          isEmpty={noRevenue}
        >
          <RevenueChart data={charts.timeSeries} />
        </ChartCard>

        <ChartCard
          title="Novos cadastros (leads)"
          description="Quantos leads chegaram em cada período."
          isEmpty={noSignups}
        >
          <SignupsChart data={charts.timeSeries} />
        </ChartCard>

        <ChartCard
          title="Funil de conversão"
          description="Visitantes → cadastros → pagantes."
        >
          <FunnelChart data={charts.funnel} />
        </ChartCard>

        <ChartCard
          title="Assinantes ativos × revogações"
          description="Acesso acumulado e cortesias revogadas."
          isEmpty={noActivity}
        >
          <ActiveCancelChart data={charts.timeSeries} />
        </ChartCard>

        <ChartCard
          title="Distribuição por trilha (cargo)"
          description="Entre os pagantes — quais funções vendem mais."
          isEmpty={noDistribution}
          emptyLabel="Nenhuma venda com trilha definida no período."
        >
          <FunctionDistributionChart data={charts.distribution} />
        </ChartCard>

        <ChartCard
          title="Engajamento"
          description="Questões respondidas e alunos ativos por período."
          isEmpty={noEngagement}
        >
          <EngagementChart data={charts.engagement} />
        </ChartCard>
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        Compra única de R$97 (acesso vitalício): não há MRR nem churn
        recorrente — por isso medimos receita do período e acessos revogados.
        A etapa “Visitantes” do funil ainda não é rastreada (depende de
        analytics de pageview na landing).
      </p>
    </div>
  )
}

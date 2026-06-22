'use client'

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { EngagementPoint } from '@/lib/admin/charts'

const config: ChartConfig = {
  answers: { label: 'Questões respondidas', color: 'hsl(var(--chart-3))' },
  returningUsers: { label: 'Alunos ativos', color: 'hsl(var(--chart-1))' },
}

export function EngagementChart({ data }: { data: EngagementPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
      <ComposedChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          yAxisId="left"
          dataKey="answers"
          fill="var(--color-answers)"
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="right"
          dataKey="returningUsers"
          type="monotone"
          stroke="var(--color-returningUsers)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  )
}

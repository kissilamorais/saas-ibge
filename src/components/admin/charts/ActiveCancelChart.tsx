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
import type { TimePoint } from '@/lib/admin/charts'

const config: ChartConfig = {
  active: { label: 'Ativos', color: 'hsl(var(--chart-1))' },
  cancellations: { label: 'Revogados', color: 'hsl(var(--chart-5))' },
}

export function ActiveCancelChart({ data }: { data: TimePoint[] }) {
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
        <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="cancellations"
          fill="var(--color-cancellations)"
          radius={[4, 4, 0, 0]}
          barSize={18}
        />
        <Line
          dataKey="active"
          type="monotone"
          stroke="var(--color-active)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  )
}

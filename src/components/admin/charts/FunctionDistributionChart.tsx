'use client'

import { Cell, Pie, PieChart } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { DistributionSlice } from '@/lib/admin/charts'

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
]

export function FunctionDistributionChart({
  data,
}: {
  data: DistributionSlice[]
}) {
  const slices = data.filter((d) => d.count > 0)
  const total = slices.reduce((acc, d) => acc + d.count, 0)

  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.key, { label: d.label, color: COLORS[i % COLORS.length] }])
  )

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <ChartContainer config={config} className="aspect-square h-[220px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={slices}
            dataKey="count"
            nameKey="label"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {slices.map((d) => (
              <Cell key={d.key} fill={config[d.key]?.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="grid w-full max-w-[220px] gap-2 text-sm">
        {data.map((d, i) => (
          <li key={d.key} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              {d.label}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {total > 0 ? `${Math.round((d.count / total) * 100)}%` : '0%'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

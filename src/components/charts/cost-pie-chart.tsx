
"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { costs } from "@/lib/data"

const costDataByCategory = costs.reduce((acc, cost) => {
    const totalCost = cost.actualAmount > 0 ? cost.actualAmount : cost.predictedAmount
    if (!acc[cost.category]) {
        acc[cost.category] = { name: cost.category, value: 0 };
    }
    acc[cost.category].value += totalCost;
    return acc;
}, {} as { [key: string]: { name: string, value: number } });

const chartData = Object.values(costDataByCategory);

const chartConfig = {
  value: {
    label: "Valor",
  },
  'Mão de obra': {
    label: "Mão de obra",
    color: "hsl(var(--chart-1))",
  },
  'Materiais': {
    label: "Materiais",
    color: "hsl(var(--chart-2))",
  },
  'Marketing': {
    label: "Marketing",
    color: "hsl(var(--chart-3))",
  },
  'Software': {
    label: "Software",
    color: "hsl(var(--chart-4))",
  },
  'Outros': {
    label: "Outros",
    color: "hsl(var(--chart-5))",
  },
}

export default function CostPieChart() {
  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[350px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="name" />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius="60%"
          strokeWidth={5}
        >
          {chartData.map((entry, index) => (
             <Cell key={`cell-${index}`} fill={chartConfig[entry.name as keyof typeof chartConfig]?.color} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  )
}

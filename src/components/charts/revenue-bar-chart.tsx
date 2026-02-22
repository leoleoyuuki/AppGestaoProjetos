
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { projects, revenues as allRevenues } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";


const chartData = projects.map(project => {
  const projectRevenues = allRevenues.filter(r => r.projectId === project.id);
  return {
    project: project.name.split(' ')[0], // Shorten name for chart
    predicted: projectRevenues.reduce((acc, r) => acc + r.predictedAmount, 0),
    actual: projectRevenues.reduce((acc, r) => acc + r.actualAmount, 0)
  }
});


const chartConfig = {
  predicted: {
    label: "Previsto",
    color: "hsl(var(--chart-3))",
  },
  actual: {
    label: "Real",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function RevenueBarChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
      <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="project"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          
        />
        <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
        <Bar dataKey="predicted" fill="var(--color-predicted)" radius={4} />
        <Bar dataKey="actual" fill="var(--color-actual)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

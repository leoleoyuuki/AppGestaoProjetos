"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "S", total: Math.floor(Math.random() * 50) + 10, fill: "var(--color-chart-2)" },
  { name: "M", total: Math.floor(Math.random() * 50) + 10, fill: "var(--color-chart-1)" },
  { name: "T", total: Math.floor(Math.random() * 80) + 20, fill: "var(--color-chart-2)" },
  { name: "W", total: Math.floor(Math.random() * 50) + 10, fill: "var(--color-chart-1)" },
  { name: "T", total: Math.floor(Math.random() * 50) + 10, fill: "var(--color-chart-2)" },
  { name: "F", total: Math.floor(Math.random() * 50) + 10, fill: "var(--color-chart-2)" },
  { name: "S", total: Math.floor(Math.random() * 50) + 10, fill: "var(--color-chart-2)" },
]

export default function ProjectAnalyticsChart() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Project Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={10} barSize={20}>
               <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                hide
              />
              <Tooltip content={<ChartTooltipContent />} cursor={{fill: 'hsl(var(--accent))', radius: '0.5rem'}} />
              <Bar dataKey="total" radius={[8, 8, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { useState, useEffect } from "react"

const generateData = () => [
  { name: "S", total: Math.floor(Math.random() * 50) + 10 },
  { name: "M", total: Math.floor(Math.random() * 50) + 10 },
  { name: "T", total: Math.floor(Math.random() * 80) + 20 },
  { name: "W", total: Math.floor(Math.random() * 50) + 10 },
  { name: "T", total: Math.floor(Math.random() * 50) + 10 },
  { name: "F", total: Math.floor(Math.random() * 50) + 10 },
  { name: "S", total: Math.floor(Math.random() * 50) + 10 },
];

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
};

export default function ProjectAnalyticsChart() {
  const [data, setData] = useState<any[]>([]);

  // Generate data on client-side only to avoid hydration mismatch
  useEffect(() => {
    setData(generateData());
  }, []);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Project Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <BarChart data={data} barGap={10} barSize={20} accessibilityLayer>
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
            <Tooltip 
              content={<ChartTooltipContent />} 
              cursor={{fill: 'hsl(var(--accent))', radius: '0.5rem'}} 
            />
            <Bar dataKey="total" radius={[8, 8, 8, 8]} fill="var(--color-total)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

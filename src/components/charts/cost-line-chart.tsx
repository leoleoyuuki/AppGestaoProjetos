"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer, Tooltip } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from "react";
import type { CostItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface CostLineChartProps {
    costs: CostItem[] | null;
    isLoading: boolean;
    userId: string | undefined;
}

const chartConfig = {
  realizado: {
    label: "Realizado",
    color: "hsl(var(--chart-1))",
  },
  previsto: {
    label: "Previsto",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export default function CostLineChart({ costs, isLoading, userId }: CostLineChartProps) {
  const chartData = useMemo(() => {
    if (!costs || !userId) return [];
    
    const userCosts = costs.filter(c => c.userId === userId);

    const data = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);
        
        const monthName = format(monthStart, 'MMM', { locale: ptBR }).replace('.','');

        const monthlyCosts = userCosts.filter(c => format(new Date(c.transactionDate + 'T00:00:00'), 'yyyy-MM') === format(monthStart, 'yyyy-MM'));

        const totalRealizado = monthlyCosts.reduce((acc, c) => acc + (c.actualAmount || 0), 0);
        const totalPrevisto = monthlyCosts.reduce((acc, c) => acc + c.plannedAmount, 0);

        return {
            month: monthName,
            realizado: totalRealizado,
            previsto: totalPrevisto,
        }
    }).reverse();

    return data;

  }, [costs, userId]);

  if(isLoading) {
    return <Skeleton className="w-full h-[300px]" />
  }

  if (chartData.length === 0 || chartData.every(d => d.previsto === 0 && d.realizado === 0)) {
    return (
        <div className="flex justify-center items-center h-[350px]">
            <p className="text-muted-foreground">Nenhum dado de custo para exibir.</p>
        </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
        <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  className="capitalize"
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip
                    content={
                        <ChartTooltipContent
                            formatter={(value, name) => (
                                <div className="flex items-center">
                                    <div className="flex-1 text-muted-foreground capitalize">{chartConfig[name as keyof typeof chartConfig]?.label}</div>
                                    <div className="font-mono font-medium tabular-nums text-foreground">{formatCurrency(Number(value))}</div>
                                </div>
                            )}
                            labelFormatter={(label) => <div className="capitalize">{label}</div>}
                        />
                    }
                />
                <Legend />
                <Line dataKey="realizado" type="monotone" stroke="var(--color-realizado)" strokeWidth={2} dot={true} />
                <Line dataKey="previsto" type="monotone" stroke="var(--color-previsto)" strokeWidth={2} strokeDasharray="3 3" dot={true} />
            </LineChart>
        </ResponsiveContainer>
    </ChartContainer>
  )
}

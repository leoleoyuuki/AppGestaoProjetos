"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from "react";
import type { CostItem, RevenueItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyIOChartProps {
    costs: CostItem[] | null;
    revenues: RevenueItem[] | null;
    isLoading: boolean;
    userId: string | undefined;
}

const chartConfig = {
  entradas: {
    label: "Entradas",
    color: "hsl(var(--chart-2))",
  },
  saidas: {
    label: "Saídas",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function MonthlyIOChart({ costs, revenues, isLoading, userId }: MonthlyIOChartProps) {
  const chartData = useMemo(() => {
    if (!costs || !revenues || !userId) return [];
    
    const userCosts = costs.filter(c => c.userId === userId);
    const userRevenues = revenues.filter(r => r.userId === userId);

    const data = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);
        
        const monthName = format(monthStart, 'MMM', { locale: ptBR });

        const monthlyRevenues = userRevenues.filter(r => format(new Date(r.transactionDate), 'yyyy-MM') === format(monthStart, 'yyyy-MM'));
        const monthlyCosts = userCosts.filter(c => format(new Date(c.transactionDate), 'yyyy-MM') === format(monthStart, 'yyyy-MM'));

        const totalRevenue = monthlyRevenues.reduce((acc, r) => acc + (r.receivedAmount || 0), 0);
        const totalCost = monthlyCosts.reduce((acc, c) => acc + (c.actualAmount || 0), 0);

        return {
            month: monthName,
            entradas: totalRevenue,
            saidas: totalCost,
        }
    }).reverse(); // reverse to show oldest month first

    return data;

  }, [costs, revenues, userId]);

  if(isLoading) {
    return <Skeleton className="w-full h-[300px]" />
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
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
            <ChartTooltipContent
                formatter={(value, name, item) => (
                    <div className="flex items-center">
                        <div
                          className="w-2.5 h-2.5 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1 text-muted-foreground capitalize">{name}</div>
                        <div className="font-mono font-medium tabular-nums text-foreground">{formatCurrency(Number(value))}</div>
                    </div>
                )}
            />
            <Legend />
            <Bar dataKey="entradas" fill="var(--color-entradas)" radius={4} />
            <Bar dataKey="saidas" fill="var(--color-saidas)" radius={4} />
        </BarChart>
    </ChartContainer>
  )
}

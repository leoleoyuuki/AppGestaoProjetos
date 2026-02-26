"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from "react";
import type { RevenueItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueLineChartProps {
    revenues: RevenueItem[] | null;
    isLoading: boolean;
    userId: string | undefined;
}

const chartConfig = {
  entradas: {
    label: "Entradas",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function RevenueLineChart({ revenues, isLoading, userId }: RevenueLineChartProps) {
  const chartData = useMemo(() => {
    if (!revenues || !userId) return [];
    
    const userRevenues = revenues.filter(r => r.userId === userId);

    const data = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);
        
        const monthName = format(monthStart, 'MMM', { locale: ptBR });

        const monthlyRevenues = userRevenues.filter(r => format(new Date(r.transactionDate), 'yyyy-MM') === format(monthStart, 'yyyy-MM'));

        const totalRevenue = monthlyRevenues.reduce((acc, r) => acc + (r.receivedAmount || 0), 0);

        return {
            month: monthName,
            entradas: totalRevenue,
        }
    }).reverse(); // reverse to show oldest month first

    return data;

  }, [revenues, userId]);

  if(isLoading) {
    return <Skeleton className="w-full h-[350px]" />
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
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
            <ChartTooltip
                cursor={false}
                content={
                    <ChartTooltipContent
                        formatter={(value, name, item) => (
                            <div className="flex items-center">
                                <div
                                  className="w-2.5 h-2.5 rounded-full mr-2"
                                  style={{ backgroundColor: item.color }}
                                />
                                <div className="flex-1 text-muted-foreground capitalize">{name as string}</div>
                                <div className="font-mono font-medium tabular-nums text-foreground">{formatCurrency(Number(value))}</div>
                            </div>
                        )}
                    />
                }
            />
            <Legend />
            <Line dataKey="entradas" type="monotone" stroke="var(--color-entradas)" strokeWidth={2} dot={false} />
        </LineChart>
    </ChartContainer>
  )
}

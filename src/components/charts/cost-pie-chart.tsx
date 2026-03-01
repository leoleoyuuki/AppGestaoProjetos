"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { CostItem } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from "../ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface CostPieChartProps {
    projectId?: string;
}

export default function CostPieChart({ projectId }: CostPieChartProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const costsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/costItems`));
  }, [firestore, user]);
  const { data: allCosts, isLoading: costsLoading } = useCollection<CostItem>(costsQuery);
  
  const { chartData, chartConfig } = useMemo(() => {
    if (!allCosts) return { chartData: [], chartConfig: {} };

    const filteredCosts = projectId
      ? allCosts.filter(cost => cost.projectId === projectId)
      : allCosts;

    if (filteredCosts.length === 0) {
        return { chartData: [], chartConfig: {} };
    }

    const costDataByCategory = filteredCosts.reduce((acc, cost) => {
        const totalCost = cost.actualAmount > 0 ? cost.actualAmount : cost.plannedAmount
        if (!acc[cost.category]) {
            acc[cost.category] = { name: cost.category, value: 0 };
        }
        acc[cost.category].value += totalCost;
        return acc;
    }, {} as { [key: string]: { name: string, value: number } });

    const data = Object.values(costDataByCategory);

    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    const config: ChartConfig = {
        value: { label: "Valor" },
    };

    data.forEach((entry, index) => {
        config[entry.name] = {
            label: entry.name,
            color: colors[index % colors.length],
        };
    });

    return { chartData: data, chartConfig: config };
}, [allCosts, projectId]);


  if (costsLoading) {
    return <div className="flex justify-center items-center h-[350px]">
        <Skeleton className="h-[350px] w-[350px] rounded-full" />
    </div>
  }

  if (chartData.length === 0) {
      return (
          <div className="flex justify-center items-center h-[350px]">
              <p className="text-muted-foreground">Nenhum dado de custo para exibir.</p>
          </div>
      )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[350px]"
    >
      <PieChart>
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent
                formatter={(value, name, item) => (
                    <div className="flex items-center">
                        <div
                            className="w-2.5 h-2.5 rounded-full mr-2"
                            style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1 text-muted-foreground capitalize">{item.payload?.name as string}</div>
                        <div className="font-mono font-medium tabular-nums text-foreground">{formatCurrency(Number(value))}</div>
                    </div>
                )}
                hideLabel
            />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius="60%"
          strokeWidth={5}
        >
          {chartData.map((entry) => (
             <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name as keyof typeof chartConfig]?.color} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  )
}

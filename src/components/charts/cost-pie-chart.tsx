"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query } from 'firebase/firestore';
import type { CostItem } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from "../ui/skeleton";
import { formatCurrency } from "@/lib/utils";


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
  const { user } = useUser();
  const firestore = useFirestore();

  const costsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collectionGroup(firestore, 'costItems'));
  }, [firestore, user]);
  const { data: costs, isLoading: costsLoading } = useCollection<CostItem>(costsQuery);
  
  const chartData = useMemo(() => {
    if(!costs) return [];
    // Filter costs for the current user, as the query now fetches across all users
    // and security rules handle the filtering at the backend.
    const userCosts = costs.filter(cost => cost.userId === user?.uid);
    const costDataByCategory = userCosts.reduce((acc, cost) => {
        const totalCost = cost.actualAmount > 0 ? cost.actualAmount : cost.plannedAmount
        if (!acc[cost.category]) {
            acc[cost.category] = { name: cost.category, value: 0 };
        }
        acc[cost.category].value += totalCost;
        return acc;
    }, {} as { [key: string]: { name: string, value: number } });

    return Object.values(costDataByCategory);
  }, [costs, user]);


  if (costsLoading) {
    return <Skeleton className="h-[350px] w-[350px] rounded-full" />
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
                        <div className="flex-1 text-muted-foreground capitalize">{name as string}</div>
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
          {chartData.map((entry, index) => (
             <Cell key={`cell-${index}`} fill={chartConfig[entry.name as keyof typeof chartConfig]?.color} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  )
}

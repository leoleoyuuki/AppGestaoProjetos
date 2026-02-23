"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from "../ui/skeleton";

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
  const { user } = useUser();
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/projects`));
  }, [firestore, user]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const chartData = useMemo(() => {
    if (!projects) return [];
    return projects.map(project => ({
      project: project.name.split(' ')[0], // Shorten name for chart
      predicted: project.plannedTotalRevenue,
      actual: project.actualTotalRevenue,
    }));
  }, [projects]);


  if (projectsLoading) {
    return <Skeleton className="h-[350px] w-full" />
  }

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
        <Bar dataKey="predicted" fill="var(--color-predicted)" radius={4} />
        <Bar dataKey="actual" fill="var(--color-actual)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

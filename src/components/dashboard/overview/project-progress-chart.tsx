"use client"

import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  progress: {
    label: "Progresso",
    color: "hsl(var(--chart-1))",
  },
  remaining: {
    label: "Restante",
    color: "hsl(var(--muted))",
  },
}

export default function ProjectProgressChart() {
    const { user } = useUser();
    const firestore = useFirestore();

    const projectsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/projects`));
    }, [firestore, user]);
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    const { progress, completed, inProgress, pending } = useMemo(() => {
        if (!projects) return { progress: 0, completed: 0, inProgress: 0, pending: 0 };
        
        const totalProjects = projects.length;
        if(totalProjects === 0) return { progress: 0, completed: 0, inProgress: 0, pending: 0 };
        
        const completedProjects = projects.filter(p => p.status === 'Concluído').length;
        const inProgressProjects = projects.filter(p => p.status === 'Em andamento').length;
        
        const overallProgress = projects.reduce((acc, p) => {
            const projectProgress = p.plannedTotalRevenue > 0 ? (p.actualTotalRevenue / p.plannedTotalRevenue) * 100 : 0;
            return acc + projectProgress;
        }, 0) / totalProjects;

        return {
            progress: overallProgress,
            completed: completedProjects,
            inProgress: inProgressProjects,
            pending: totalProjects - completedProjects - inProgressProjects
        };

    }, [projects]);
    
    const chartData = [
        { name: "progress", value: progress, fill: "var(--color-progress)" },
        { name: "remaining", value: 100 - progress, fill: "var(--color-remaining)" },
    ];

  return (
    <Card className="rounded-2xl col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {projectsLoading ? <Skeleton className="w-full h-[200px]" /> : (
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="h-[200px] w-[200px] relative">
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square h-full"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent
                            formatter={(value, name) => (
                                <div className="flex items-center">
                                    <div className="flex-1 text-muted-foreground capitalize">{chartConfig[name as keyof typeof chartConfig]?.label}</div>
                                    <div className="font-mono font-medium tabular-nums text-foreground">{`${Math.round(Number(value))}%`}</div>
                                </div>
                            )}
                            hideLabel
                            hideIndicator
                        />}
                      />
                      <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          startAngle={90}
                          endAngle={450}
                          dataKey="value"
                          stroke="none"
                      />
                    </PieChart>
                  </ChartContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                          <p className="text-4xl font-bold">{Math.round(progress)}%</p>
                          <p className="text-sm text-muted-foreground">Project Ended</p>
                      </div>
                  </div>
                </div>
                 <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-green-500" />
                       <div>
                         <p className="font-medium">{completed} Completed</p>
                       </div>
                    </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-blue-500" />
                       <div>
                         <p className="font-medium">{inProgress} In Progress</p>
                       </div>
                    </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-yellow-500" />
                       <div>
                         <p className="font-medium">{pending} Pending</p>
                       </div>
                    </div>
                 </div>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
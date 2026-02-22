"use client"

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";


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
        { name: "Progress", value: progress },
        { name: "Remaining", value: 100 - progress },
    ];

    const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

  return (
    <Card className="rounded-2xl col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {projectsLoading ? <Skeleton className="w-full h-[200px]" /> : (
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="h-[200px] w-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
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
                    >
                        {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    </PieChart>
                </ResponsiveContainer>
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


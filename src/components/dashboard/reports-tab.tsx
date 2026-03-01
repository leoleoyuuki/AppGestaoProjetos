'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CostPieChart from '../charts/cost-pie-chart';
import RevenueBarChart from '../charts/revenue-bar-chart';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '../ui/skeleton';

export default function ReportsTab() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const { user } = useUser();
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/projects`));
  }, [firestore, user]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div>
                <CardTitle>Distribuição de Custos</CardTitle>
                <CardDescription>Distribuição percentual por categoria.</CardDescription>
              </div>
              {projectsLoading ? <Skeleton className="h-10 w-48" /> : (
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Geral (Todos os Custos)</SelectItem>
                    {projects?.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
          </div>
        </CardHeader>
        <CardContent>
          <CostPieChart projectId={selectedProjectId === 'all' ? undefined : selectedProjectId} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Receita: Previsto vs. Real</CardTitle>
          <CardDescription>Comparação da receita prevista com a receita real por projeto.</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueBarChart />
        </CardContent>
      </Card>
    </div>
  );
}

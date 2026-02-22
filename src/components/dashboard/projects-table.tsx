'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import type { Project, ProjectStatus } from '@/lib/types';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

const statusVariant: { [key in ProjectStatus]: 'default' | 'secondary' | 'destructive' } = {
  'Em andamento': 'default',
  'Concluído': 'secondary',
  'Cancelado': 'destructive',
};

export default function ProjectsTable() {
  const { user } = useUser();
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'projects'));
  }, [firestore, user]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const projectData = projects?.map(proj => {
    const totalPredictedRevenue = proj.plannedTotalRevenue;
    const totalActualRevenue = proj.actualTotalRevenue;

    const totalPredictedCost = proj.plannedTotalCost;
    const totalActualCost = proj.actualTotalCost;
    
    const predictedProfit = totalPredictedRevenue - totalPredictedCost;
    const actualProfit = totalActualRevenue - totalActualCost;

    const progress = totalPredictedRevenue > 0 ? (totalActualRevenue / totalPredictedRevenue) * 100 : 0;

    return {
      ...proj,
      predictedProfit,
      actualProfit,
      progress,
    };
  });

  if (projectsLoading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Projeto</TableHead>
          <TableHead className="hidden md:table-cell">Status</TableHead>
          <TableHead className="hidden lg:table-cell">Progresso</TableHead>
          <TableHead className="text-right">Lucro Previsto</TableHead>
          <TableHead className="text-right hidden md:table-cell">Lucro Real</TableHead>
          <TableHead><span className="sr-only">Ações</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projectData?.map(proj => (
          <TableRow key={proj.id}>
            <TableCell>
              <div className="font-medium">{proj.name}</div>
              <div className="text-sm text-muted-foreground hidden sm:inline">{proj.client}</div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant={statusVariant[proj.status]}>{proj.status}</Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <div className="flex items-center gap-2">
                <Progress value={proj.progress} className="h-2" />
                <span className="text-xs text-muted-foreground">{Math.round(proj.progress)}%</span>
              </div>
            </TableCell>
            <TableCell className="text-right">{formatCurrency(proj.predictedProfit)}</TableCell>
            <TableCell className="text-right hidden md:table-cell">{formatCurrency(proj.actualProfit)}</TableCell>
            <TableCell>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                  <DropdownMenuItem>Editar Projeto</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

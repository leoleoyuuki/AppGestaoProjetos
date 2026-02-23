'use client';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { Project, ProjectStatus } from '@/lib/types';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { DeleteAlertDialog } from '../ui/delete-alert-dialog';
import { deleteProject } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const statusVariant: { [key in ProjectStatus]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Pendente': 'outline',
  'Em andamento': 'default',
  'Instalado': 'default',
  'Concluído': 'secondary',
  'Cancelado': 'destructive',
};

export default function ProjectsTable() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [deletingProject, setDeletingProject] = useState<Project | undefined>(undefined);

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'projects'));
  }, [firestore, user]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const projectData = projects?.map(proj => {
    const actualProfit = proj.actualTotalRevenue - proj.actualTotalCost;
    const marginPercentage = proj.actualTotalRevenue > 0 ? (actualProfit / proj.actualTotalRevenue) * 100 : 0;

    return {
      ...proj,
      actualProfit,
      marginPercentage,
    };
  });

  const handleDeleteConfirm = () => {
    if (!deletingProject || !user) return;
    deleteProject(firestore, user.uid, deletingProject.id);
    toast({ title: 'Sucesso', description: 'Projeto excluído.' });
    setDeletingProject(undefined);
  };
  
  const handleRowClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
  };

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
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor Total (R$)</TableHead>
            <TableHead className="text-right">Custo Estimado (R$)</TableHead>
            <TableHead className="text-right">Receita Realizada (R$)</TableHead>
            <TableHead className="text-right">Custos Realizados (R$)</TableHead>
            <TableHead className="text-right">Margem Real (R$)</TableHead>
            <TableHead className="text-right">Margem Real (%)</TableHead>
            <TableHead className="text-right"><span className="sr-only">Ações</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projectData?.map(proj => (
            <TableRow key={proj.id} onClick={() => handleRowClick(proj.id)} className="cursor-pointer">
              <TableCell>
                <div className="font-medium">{proj.name}</div>
                <div className="text-sm text-muted-foreground">{proj.client}</div>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[proj.status]}>{proj.status}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(proj.plannedTotalRevenue)}</TableCell>
              <TableCell className="text-right">{formatCurrency(proj.plannedTotalCost)}</TableCell>
              <TableCell className="text-right">{formatCurrency(proj.actualTotalRevenue)}</TableCell>
              <TableCell className="text-right">{formatCurrency(proj.actualTotalCost)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(proj.actualProfit)}</TableCell>
              <TableCell className="text-right">{proj.marginPercentage.toFixed(1)}%</TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingProject(proj)}>Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DeleteAlertDialog
        isOpen={!!deletingProject}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeletingProject(undefined);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Tem certeza que deseja excluir este projeto?"
        description="Esta ação não pode ser desfeita. Todos os dados associados a este projeto serão perdidos."
      />
    </>
  );
}

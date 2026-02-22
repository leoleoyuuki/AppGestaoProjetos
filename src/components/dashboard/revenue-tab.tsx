'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle } from 'lucide-react';
import type { RevenueItem, Project } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function RevenueTab() {
  const { user } = useUser();
  const firestore = useFirestore();

  const revenuesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collectionGroup(firestore, 'revenueItems'));
  }, [firestore, user]);
  const { data: revenues, isLoading: revenuesLoading } = useCollection<RevenueItem>(revenuesQuery);
  
  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/projects`));
  }, [firestore, user]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const getProjectName = (projectId: string) => {
    return projects?.find(p => p.id === projectId)?.name;
  };
  
  const userRevenues = revenues?.filter(revenue => revenue.userId === user?.uid);
  const isLoading = revenuesLoading || projectsLoading;


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Todas as Receitas</CardTitle>
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Receita
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Previsto</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5}>
                     <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && userRevenues?.map(revenue => {
                const status = revenue.receivedAmount > 0 ? 'Recebido' : 'Pendente';
                return (
                  <TableRow key={revenue.id}>
                    <TableCell className="font-medium">{revenue.name}</TableCell>
                    <TableCell>{getProjectName(revenue.projectId)}</TableCell>
                    <TableCell>
                      <Badge variant={status === 'Recebido' ? 'secondary' : 'default'}>{status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(revenue.plannedAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(revenue.receivedAmount)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import type { RevenueItem, Project } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RevenueItemDialog } from './revenue-item-dialog';
import { DeleteAlertDialog } from '../ui/delete-alert-dialog';
import { deleteRevenueItem } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export default function RevenueTab() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isRevenueItemDialogOpen, setRevenueItemDialogOpen] = useState(false);
  const [editingRevenueItem, setEditingRevenueItem] = useState<RevenueItem | undefined>(undefined);
  const [deletingRevenueItem, setDeletingRevenueItem] = useState<RevenueItem | undefined>(undefined);

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

  const getProjectForRevenue = (projectId: string) => {
    return projects?.find(p => p.id === projectId);
  };

  const handleDeleteConfirm = () => {
    if (!deletingRevenueItem || !user) return;
    deleteRevenueItem(firestore, user.uid, deletingRevenueItem.projectId, deletingRevenueItem.id);
    toast({ title: 'Sucesso', description: 'Conta a receber excluída.' });
    setDeletingRevenueItem(undefined);
  };
  
  const userRevenues = revenues?.filter(revenue => revenue.userId === user?.uid);
  const isLoading = revenuesLoading || projectsLoading;

  const openDialogForEdit = (revenue: RevenueItem) => {
    setEditingRevenueItem(revenue);
    setRevenueItemDialogOpen(true);
  };

  const openDialogForCreate = () => {
    setEditingRevenueItem(undefined);
    setRevenueItemDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contas a Receber</CardTitle>
          <Button size="sm" onClick={openDialogForCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Conta
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Data de vencimento</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="text-right"><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9}>
                     <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && userRevenues?.map(revenue => {
                const project = getProjectForRevenue(revenue.projectId);
                const status = revenue.receivedAmount > 0 ? 'Recebido' : 'Pendente';
                return (
                  <TableRow key={revenue.id}>
                    <TableCell className="font-medium">{project?.name || 'N/A'}</TableCell>
                    <TableCell>{project?.client || 'N/A'}</TableCell>
                    <TableCell>{revenue.name}</TableCell>
                    <TableCell>{new Date(revenue.transactionDate).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(revenue.plannedAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={status === 'Recebido' ? 'secondary' : 'default'}>{status}</Badge>
                    </TableCell>
                    <TableCell>N/A</TableCell> {/* Forma de Pagamento */}
                    <TableCell className="truncate max-w-xs">{revenue.description || '-'}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDialogForEdit(revenue)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingRevenueItem(revenue)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && (!userRevenues || userRevenues.length === 0) && (
                 <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">Nenhuma conta a receber encontrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {(isRevenueItemDialogOpen || editingRevenueItem !== undefined) && projects && (
         <RevenueItemDialog 
            isOpen={isRevenueItemDialogOpen}
            onOpenChange={setRevenueItemDialogOpen}
            projects={projects}
            revenueItem={editingRevenueItem}
         />
      )}
      {deletingRevenueItem && <DeleteAlertDialog
        isOpen={!!deletingRevenueItem}
        onOpenChange={(isOpen) => !isOpen && setDeletingRevenueItem(undefined)}
        onConfirm={handleDeleteConfirm}
        title="Tem certeza que deseja excluir esta conta?"
        description="Esta ação não pode ser desfeita e irá remover permanentemente a conta a receber."
      />}
    </div>
  );
}

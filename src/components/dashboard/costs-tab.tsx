'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { CostItem, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CostItemDialog } from './cost-item-dialog';
import { DeleteAlertDialog } from '../ui/delete-alert-dialog';
import { deleteCostItem, payCostItem, recreateCostItemForNextMonth } from '@/lib/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CostsTab() {
  const { toast } = useToast();
  const [isCostItemDialogOpen, setCostItemDialogOpen] = useState(false);
  const [editingCostItem, setEditingCostItem] = useState<CostItem | undefined>(undefined);
  const [deletingCostItem, setDeletingCostItem] = useState<CostItem | undefined>(undefined);

  const { user } = useUser();
  const firestore = useFirestore();

  const costsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/costItems`));
  }, [firestore, user]);
  const { data: costs, isLoading: costsLoading } = useCollection<CostItem>(costsQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/projects`));
  }, [firestore, user]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'Geral';
    return projects?.find(p => p.id === projectId)?.name || 'Geral';
  };

  const handleDeleteConfirm = () => {
    if (!deletingCostItem || !user) return;
    deleteCostItem(firestore, user.uid, deletingCostItem.id);
    toast({ title: 'Sucesso', description: 'Conta a pagar excluída.' });
    setDeletingCostItem(undefined);
  };
  
  const handlePayCostItem = (cost: CostItem) => {
    if (!user) return;
    payCostItem(firestore, user.uid, cost);
    toast({ title: 'Sucesso!', description: 'Conta marcada como paga.' });
  }

  const handleRecreateForNextMonth = (cost: CostItem) => {
    if (!user) return;
    recreateCostItemForNextMonth(firestore, user.uid, cost);
    toast({ title: 'Sucesso!', description: `Conta "${cost.name}" recriada para o próximo mês.` });
  }

  const isLoading = costsLoading || projectsLoading;

  const openDialogForEdit = (cost: CostItem) => {
    setEditingCostItem(cost);
    setCostItemDialogOpen(true);
  }

  const openDialogForCreate = () => {
    setEditingCostItem(undefined);
    setCostItemDialogOpen(true);
  }

  const getStatus = (cost: CostItem): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
    // Handle legacy data that might not have a status
    const status = cost.status || (cost.actualAmount > 0 ? 'Pago' : 'Pendente');
    
    if (status === 'Pago') {
        return { label: 'Pago', variant: 'secondary' };
    }
    const isOverdue = new Date(cost.transactionDate) < new Date();
    if (isOverdue) {
        return { label: 'Atrasado', variant: 'destructive' };
    }
    return { label: 'Pendente', variant: 'default' };
  }

  const recurringCosts = costs?.filter(cost => cost.isRecurring) || [];
  const nonRecurringCosts = costs?.filter(cost => !cost.isRecurring) || [];
  
  const renderTable = (costList: CostItem[], isRecurringTab = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fornecedor</TableHead>
          <TableHead>Referência</TableHead>
          <TableHead>Data de vencimento</TableHead>
          <TableHead className="text-right">Valor (R$)</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Observação</TableHead>
          <TableHead className="text-right"><span className="sr-only">Ações</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && (
          <TableRow>
            <TableCell colSpan={8}>
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </TableCell>
          </TableRow>
        )}
        {!isLoading && costList.map(cost => {
          const { label, variant } = getStatus(cost);
          return (
            <TableRow key={cost.id}>
              <TableCell className="font-medium">{cost.supplier || '-'}</TableCell>
              <TableCell>{getProjectName(cost.projectId)}</TableCell>
              <TableCell>{new Date(cost.transactionDate).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell className="text-right">{formatCurrency(cost.plannedAmount)}</TableCell>
              <TableCell><Badge variant="outline">{cost.category}</Badge></TableCell>
              <TableCell><Badge variant={variant}>{label}</Badge></TableCell>
              <TableCell className="truncate max-w-xs">{cost.description || '-'}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isRecurringTab && (
                      <DropdownMenuItem onClick={() => handleRecreateForNextMonth(cost)}>Recriar p/ próximo mês</DropdownMenuItem>
                    )}
                    {label !== 'Pago' && (
                      <DropdownMenuItem onClick={() => handlePayCostItem(cost)}>Marcar como Pago</DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => openDialogForEdit(cost)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingCostItem(cost)}>
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
        {!isLoading && costList.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center">Nenhuma conta a pagar encontrada.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Contas a Pagar</h1>
        <Button size="sm" onClick={openDialogForCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Conta
        </Button>
      </div>

      <Tabs defaultValue="non-recurring">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="non-recurring">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
        </TabsList>
        <TabsContent value="non-recurring">
            <Card>
                <CardHeader>
                    <CardTitle>Contas com Vencimento Único</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderTable(nonRecurringCosts, false)}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="recurring">
            <Card>
                 <CardHeader>
                    <CardTitle>Contas Recorrentes</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderTable(recurringCosts, true)}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {(isCostItemDialogOpen || editingCostItem !== undefined) && projects && (
         <CostItemDialog 
            isOpen={isCostItemDialogOpen}
            onOpenChange={setCostItemDialogOpen}
            projects={projects}
            costItem={editingCostItem}
         />
      )}
      {deletingCostItem && <DeleteAlertDialog
        isOpen={!!deletingCostItem}
        onOpenChange={(isOpen) => !isOpen && setDeletingCostItem(undefined)}
        onConfirm={handleDeleteConfirm}
        title="Tem certeza que deseja excluir esta conta?"
        description="Esta ação não pode ser desfeita e irá remover permanentemente a conta a pagar."
      />}
    </div>
  );
}

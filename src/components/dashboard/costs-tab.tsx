'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { CostItem, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CostItemDialog } from './cost-item-dialog';
import { DeleteAlertDialog } from '../ui/delete-alert-dialog';
import { deleteCostItem, payCostItem } from '@/lib/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

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
    if (!deletingCostItem || !user || !firestore) return;
    deleteCostItem(firestore, user.uid, deletingCostItem);
    toast({ title: 'Sucesso', description: 'Conta a pagar excluída.' });
    setDeletingCostItem(undefined);
  };
  
  const handlePayCostItem = (cost: CostItem) => {
    if (!user || !firestore) return;
    payCostItem(firestore, user.uid, cost);
    toast({ title: 'Sucesso!', description: 'Conta marcada como paga.' });
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
    const status = cost.status || (cost.actualAmount > 0 ? 'Pago' : 'Pendente');
    
    if (status === 'Pago') {
        return { label: 'Pago', variant: 'secondary' };
    }
    const transactionDate = new Date(cost.transactionDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    if (transactionDate < today) {
        return { label: 'Atrasado', variant: 'destructive' };
    }
    return { label: 'Pendente', variant: 'default' };
  }

  const { overdueCosts, thisWeekCosts } = useMemo(() => {
    if (!costs) return { overdueCosts: [], thisWeekCosts: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    const overdue = costs.filter(cost => {
        const { label } = getStatus(cost);
        return label === 'Atrasado';
    });

    const thisWeek = costs.filter(cost => {
        const transactionDate = new Date(cost.transactionDate + 'T00:00:00');
        return isWithinInterval(transactionDate, { start: weekStart, end: weekEnd });
    });

    return { overdueCosts: overdue, thisWeekCosts: thisWeek };
  }, [costs]);

  const CostList = ({ data, loading }: { data: CostItem[] | null, loading: boolean }) => (
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Data de vencimento</TableHead>
              <TableHead className="text-right">Valor (R$)</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"><span className="sr-only">Ações</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && data && data.map(cost => {
              const { label, variant } = getStatus(cost);
              return (
                <TableRow key={cost.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{cost.name}</span>
                      {cost.isRecurring && <Badge variant="outline" className="text-muted-foreground"><RefreshCw className="h-3 w-3 mr-1" /> Recorrente</Badge>}
                    </div>
                    {cost.supplier && <div className="text-xs text-muted-foreground">{cost.supplier}</div>}
                  </TableCell>
                  <TableCell>{getProjectName(cost.projectId)}</TableCell>
                  <TableCell>{new Date(cost.transactionDate + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cost.plannedAmount)}</TableCell>
                  <TableCell><Badge variant="outline">{cost.category}</Badge></TableCell>
                  <TableCell><Badge variant={variant}>{label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
            {!loading && (!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">Nenhuma conta a pagar encontrada.</TableCell>
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

       <Card>
          <CardHeader>
              <CardTitle>Lançamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="overdue">Atrasados</TabsTrigger>
                    <TabsTrigger value="this-week">Esta Semana</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    <CostList data={costs} loading={isLoading} />
                </TabsContent>
                <TabsContent value="overdue" className="mt-4">
                    <CostList data={overdueCosts} loading={isLoading} />
                </TabsContent>
                <TabsContent value="this-week" className="mt-4">
                    <CostList data={thisWeekCosts} loading={isLoading} />
                </TabsContent>
            </Tabs>
          </CardContent>
      </Card>

      {isCostItemDialogOpen && projects && (
         <CostItemDialog 
            isOpen={isCostItemDialogOpen}
            onOpenChange={(isOpen) => {
                setCostItemDialogOpen(isOpen);
                if (!isOpen) setEditingCostItem(undefined);
            }}
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

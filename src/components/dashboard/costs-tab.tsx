'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, MoreHorizontal, RefreshCw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { CostItem, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CostItemDialog } from './cost-item-dialog';
import { DeleteAlertDialog } from '../ui/delete-alert-dialog';
import { deleteCostItem, payCostItem, unpayCostItem } from '@/lib/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export default function CostsTab() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');
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

  const handleDeleteConfirm = async () => {
    if (deletingCostItem && user && firestore) {
      await deleteCostItem(firestore, user.uid, deletingCostItem);
      toast({ title: 'Sucesso', description: 'Conta a pagar excluída.' });
    }
    setDeletingCostItem(undefined);
  };
  
  const handlePayCostItem = async (cost: CostItem) => {
    if (!user || !firestore) return;
    await payCostItem(firestore, user.uid, cost);
    toast({ title: 'Sucesso!', description: 'Conta marcada como paga.' });
  }

  const handleUnpayCostItem = async (cost: CostItem) => {
    if (!user || !firestore) return;
    await unpayCostItem(firestore, user.uid, cost);
    toast({ title: 'Sucesso!', description: 'Pagamento desmarcado.' });
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
    const isPaid = cost.status === 'Pago' || cost.actualAmount > 0;
    if (isPaid) {
        return { label: 'Pago', variant: 'secondary' };
    }
    
    // It's not paid, so it's either Pending or Overdue.
    const transactionDate = new Date(cost.transactionDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    if (transactionDate < today) {
        return { label: 'Atrasado', variant: 'destructive' };
    }
    return { label: 'Pendente', variant: 'default' };
  }

  const sortedCosts = useMemo(() => {
    if (!costs) return [];

    const getStatusValue = (cost: CostItem) => {
      const { label } = getStatus(cost);
      if (label === 'Atrasado') return 1;
      if (label === 'Pendente') return 2;
      return 3; // 'Pago'
    };

    return [...costs].sort((a, b) => {
      const statusA = getStatusValue(a);
      const statusB = getStatusValue(b);

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      const dateA = new Date(a.transactionDate + 'T00:00:00').getTime();
      const dateB = new Date(b.transactionDate + 'T00:00:00').getTime();
      
      if (statusA <= 2) { // Atrasado & Pendente
        return dateA - dateB;
      }

      // Pago
      return dateB - dateA;
    });
  }, [costs]);

  const { overdueCosts, thisWeekCosts } = useMemo(() => {
    if (!costs) return { overdueCosts: [], thisWeekCosts: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    const getStatusValue = (cost: CostItem) => {
        const { label } = getStatus(cost);
        if (label === 'Atrasado') return 1;
        if (label === 'Pendente') return 2;
        return 3; // 'Pago'
    };

    const sortWithStatus = (a: CostItem, b: CostItem) => {
        const statusA = getStatusValue(a);
        const statusB = getStatusValue(b);

        if (statusA !== statusB) {
            return statusA - statusB;
        }

        const dateA = new Date(a.transactionDate + 'T00:00:00').getTime();
        const dateB = new Date(b.transactionDate + 'T00:00:00').getTime();
        
        if (statusA <= 2) { // Atrasado & Pendente
            return dateA - dateB;
        }

        // Pago
        return dateB - dateA;
    };

    const overdue = costs
      .filter(cost => getStatus(cost).label === 'Atrasado')
      .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

    const thisWeek = costs
      .filter(cost => {
        const transactionDate = new Date(cost.transactionDate + 'T00:00:00');
        return isWithinInterval(transactionDate, { start: weekStart, end: weekEnd });
      })
      .sort(sortWithStatus);

    return { overdueCosts: overdue, thisWeekCosts: thisWeek };
  }, [costs]);

  const CostList = ({ data, loading }: { data: CostItem[] | null, loading: boolean }) => (
      <>
        {/* Mobile View */}
        <div className="md:hidden space-y-4">
            {loading && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            {!loading && data && data.map(cost => {
              const { label, variant } = getStatus(cost);
              const isPaid = label === 'Pago';
              return (
                <Card key={cost.id}>
                    <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium">{cost.name}</p>
                                <p className="text-sm text-muted-foreground">{getProjectName(cost.projectId)}</p>
                            </div>
                            <Badge variant={variant}>{label}</Badge>
                        </div>
                        {cost.isRecurring && <Badge variant="outline" className="text-muted-foreground"><RefreshCw className="h-3 w-3 mr-1" /> Recorrente</Badge>}
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>Vencimento: {new Date(cost.transactionDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                            <p>Valor: <span className="font-medium text-foreground">{formatCurrency(cost.plannedAmount)}</span></p>
                            <div>Categoria: <Badge variant="outline" className="ml-1">{cost.category}</Badge></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            {isPaid ? (
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={() => handleUnpayCostItem(cost)}>
                                    Desmarcar Pagamento
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" className="h-8" onClick={() => handlePayCostItem(cost)}>
                                    <Check className="mr-1 h-4 w-4" />
                                    Pagar
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openDialogForEdit(cost)}>Editar</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingCostItem(cost)}>
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>
              )
            })}
             {!loading && (!data || data.length === 0) && (
              <div className="text-center text-sm text-muted-foreground py-10">
                <p>Nenhuma conta a pagar encontrada.</p>
              </div>
            )}
        </div>
        {/* Desktop View */}
        <Table className="hidden md:table">
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
                const isPaid = label === 'Pago';
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
                       <div className="flex items-center justify-end gap-2">
                            {isPaid ? (
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => handleUnpayCostItem(cost)}>
                                    Desmarcar
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" className="h-8" onClick={() => handlePayCostItem(cost)}>
                                    <Check className="mr-1 h-4 w-4" />
                                    Pagar
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openDialogForEdit(cost)}>Editar</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingCostItem(cost)}>
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
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
      </>
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
            <Tabs defaultValue={activeTab || 'all'} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="overdue">Atrasados</TabsTrigger>
                    <TabsTrigger value="this-week">Esta Semana</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    <CostList data={sortedCosts} loading={isLoading} />
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
                if (!isOpen) setEditingCostItem(undefined);
                setCostItemDialogOpen(isOpen);
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

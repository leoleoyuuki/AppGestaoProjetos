'use client';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, MoreHorizontal, Check } from 'lucide-react';
import type { RevenueItem, Project } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RevenueItemDialog } from './revenue-item-dialog';
import { DeleteAlertDialog } from '../ui/delete-alert-dialog';
import { deleteRevenueItem, receiveRevenueItem } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export default function RevenueTab() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');

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

  const handleDeleteConfirm = async () => {
    if (!deletingRevenueItem || !user || !firestore) return;
    await deleteRevenueItem(firestore, user.uid, deletingRevenueItem);
    toast({ title: 'Sucesso', description: 'Conta a receber excluída.' });
    setDeletingRevenueItem(undefined);
  };
  
  const handleReceiveRevenueItem = async (revenue: RevenueItem) => {
    if (!user || !firestore) return;
    await receiveRevenueItem(firestore, user.uid, revenue);
    toast({ title: 'Sucesso!', description: 'Conta marcada como recebida.' });
  }

  const getStatus = (revenue: RevenueItem): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
    if (revenue.receivedAmount > 0) {
        return { label: 'Recebido', variant: 'secondary' };
    }
    const transactionDate = new Date(revenue.transactionDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const isOverdue = transactionDate < today;

    if (isOverdue) {
        return { label: 'Atrasado', variant: 'destructive' };
    }
    return { label: 'Pendente', variant: 'default' };
  }
  
  const userRevenues = useMemo(() => {
    if (!revenues || !user) return [];
    return revenues.filter(revenue => revenue.userId === user?.uid);
  }, [revenues, user]);

  const sortedRevenues = useMemo(() => {
    if (!userRevenues) return [];

    const getStatusValue = (revenue: RevenueItem) => {
      const { label } = getStatus(revenue);
      if (label === 'Atrasado') return 1;
      if (label === 'Pendente') return 2;
      return 3; // 'Recebido'
    };

    return [...userRevenues].sort((a, b) => {
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

      // Recebido
      return dateB - dateA;
    });
  }, [userRevenues]);

  const isLoading = revenuesLoading || projectsLoading;

  const openDialogForEdit = (revenue: RevenueItem) => {
    setEditingRevenueItem(revenue);
    setRevenueItemDialogOpen(true);
  };

  const openDialogForCreate = () => {
    setEditingRevenueItem(undefined);
    setRevenueItemDialogOpen(true);
  };

  const { overdueRevenues, thisWeekRevenues } = useMemo(() => {
    if (!userRevenues) return { overdueRevenues: [], thisWeekRevenues: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    
    const getStatusValue = (revenue: RevenueItem) => {
        const { label } = getStatus(revenue);
        if (label === 'Atrasado') return 1;
        if (label === 'Pendente') return 2;
        return 3; // 'Recebido'
    };

    const sortWithStatus = (a: RevenueItem, b: RevenueItem) => {
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

        // Recebido
        return dateB - dateA;
    };

    const overdue = userRevenues
      .filter(revenue => getStatus(revenue).label === 'Atrasado')
      .sort((a,b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

    const thisWeek = userRevenues
      .filter(revenue => {
        const transactionDate = new Date(revenue.transactionDate + 'T00:00:00');
        return isWithinInterval(transactionDate, { start: weekStart, end: weekEnd });
      })
      .sort(sortWithStatus);

    return { overdueRevenues: overdue, thisWeekRevenues: thisWeek };
  }, [userRevenues]);

  const RevenueList = ({ data, loading }: { data: RevenueItem[] | null | undefined, loading: boolean }) => (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {loading && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        {!loading && data && data.map(revenue => {
          const project = getProjectForRevenue(revenue.projectId);
          const { label, variant } = getStatus(revenue);
          const isPaid = label === 'Recebido';
          return (
            <Card key={revenue.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-medium">{revenue.name}</p>
                        <p className="text-sm text-muted-foreground">{project?.name || 'N/A'}</p>
                    </div>
                    <Badge variant={variant}>{label}</Badge>
                </div>
                 <div className="text-sm text-muted-foreground">
                    <p>Vencimento: {new Date(revenue.transactionDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    <p>Valor: <span className="font-medium text-foreground">{formatCurrency(revenue.plannedAmount)}</span></p>
                    <p>Cliente: {project?.client || 'N/A'}</p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  {!isPaid && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => handleReceiveRevenueItem(revenue)}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Receber
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!loading && (!data || data.length === 0) && (
          <div className="text-center text-sm text-muted-foreground py-10">
            <p>Nenhuma conta a receber encontrada.</p>
          </div>
        )}
      </div>
      {/* Desktop View */}
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead>Projeto</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Parcela</TableHead>
            <TableHead>Data de vencimento</TableHead>
            <TableHead className="text-right">Valor (R$)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Forma</TableHead>
            <TableHead>Observação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={9}>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </TableCell>
            </TableRow>
          )}
          {!loading && data && data.length > 0 && data.map(revenue => {
            const project = getProjectForRevenue(revenue.projectId);
            const { label, variant } = getStatus(revenue);
            const isPaid = label === 'Recebido';
            return (
              <TableRow key={revenue.id}>
                <TableCell className="font-medium">{project?.name || 'N/A'}</TableCell>
                <TableCell>{project?.client || 'N/A'}</TableCell>
                <TableCell>{revenue.name}</TableCell>
                <TableCell>{new Date(revenue.transactionDate + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right">{formatCurrency(revenue.plannedAmount)}</TableCell>
                <TableCell>
                  <Badge variant={variant}>{label}</Badge>
                </TableCell>
                <TableCell>N/A</TableCell>
                <TableCell className="truncate max-w-xs">{revenue.description || '-'}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    {!isPaid && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => handleReceiveRevenueItem(revenue)}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Confirmar
                      </Button>
                    )}
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
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {!loading && (!data || data.length === 0) && (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">Nenhuma conta a receber encontrada.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Contas a Receber</h1>
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
                    <RevenueList data={sortedRevenues} loading={isLoading} />
                </TabsContent>
                <TabsContent value="overdue" className="mt-4">
                    <RevenueList data={overdueRevenues} loading={isLoading} />
                </TabsContent>
                <TabsContent value="this-week" className="mt-4">
                    <RevenueList data={thisWeekRevenues} loading={isLoading} />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
      {isRevenueItemDialogOpen && projects && (
         <RevenueItemDialog 
            isOpen={isRevenueItemDialogOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) setEditingRevenueItem(undefined);
              setRevenueItemDialogOpen(isOpen);
            }}
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

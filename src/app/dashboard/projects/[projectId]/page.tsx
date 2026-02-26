'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import KeyMetricCard from '@/components/dashboard/overview/key-metric-card';
import { formatCurrency } from '@/lib/utils';
import type { Project, CostItem, RevenueItem, ProjectStatus } from '@/lib/types';
import { PlusCircle, DollarSign, Wallet, Activity, Percent, TrendingUp, TrendingDown, Edit, CheckCircle, MoreHorizontal, Check } from 'lucide-react';
import { CostItemDialog } from '@/components/dashboard/cost-item-dialog';
import { RevenueItemDialog } from '@/components/dashboard/revenue-item-dialog';
import { ProjectDialog } from '@/components/dashboard/project-dialog';
import { updateProject, payCostItem, deleteCostItem, receiveRevenueItem, deleteRevenueItem } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog';

const statusVariant: { [key in ProjectStatus]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Pendente': 'outline',
  'Em andamento': 'default',
  'Instalado': 'default',
  'Concluído': 'secondary',
  'Cancelado': 'destructive',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isCostDialogOpen, setCostDialogOpen] = useState(false);
  const [isRevenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);

  const [editingCostItem, setEditingCostItem] = useState<CostItem | undefined>(undefined);
  const [deletingCostItem, setDeletingCostItem] = useState<CostItem | undefined>(undefined);
  const [editingRevenueItem, setEditingRevenueItem] = useState<RevenueItem | undefined>(undefined);
  const [deletingRevenueItem, setDeletingRevenueItem] = useState<RevenueItem | undefined>(undefined);

  const projectRef = useMemoFirebase(() => {
    if (!user || !firestore || !projectId) return null;
    return doc(firestore, `users/${user.uid}/projects`, projectId);
  }, [firestore, user, projectId]);
  const { data: project, isLoading: projectLoading } = useDoc<Project>(projectRef);

  const costsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !projectId) return null;
    return query(collection(firestore, `users/${user.uid}/costItems`), where("projectId", "==", projectId));
  }, [firestore, user, projectId]);
  const { data: costs, isLoading: costsLoading } = useCollection<CostItem>(costsQuery);
  
  const revenuesQuery = useMemoFirebase(() => {
    if (!projectRef) return null;
    return query(collection(projectRef, 'revenueItems'));
  }, [projectRef]);
  const { data: revenues, isLoading: revenuesLoading } = useCollection<RevenueItem>(revenuesQuery);

  const isLoading = projectLoading || costsLoading || revenuesLoading;

  // --- Action Handlers ---
  const handleCompleteProject = async () => {
    if (!user || !firestore || !project) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível concluir o projeto.' });
      return;
    }
    await updateProject(firestore, user.uid, project.id, { status: 'Concluído' });
    toast({ title: 'Sucesso!', description: 'Projeto marcado como concluído.' });
  };

  const openCostDialogForEdit = (cost: CostItem) => {
    setEditingCostItem(cost);
    setCostDialogOpen(true);
  }
  const openCostDialogForCreate = () => {
      setEditingCostItem(undefined);
      setCostDialogOpen(true);
  }
  const handlePayCostItem = async (cost: CostItem) => {
      if (!user || !firestore) return;
      await payCostItem(firestore, user.uid, cost);
      toast({ title: 'Sucesso!', description: 'Conta marcada como paga.' });
  }
  const handleDeleteCostConfirm = async () => {
      if (!deletingCostItem || !user || !firestore) return;
      await deleteCostItem(firestore, user.uid, deletingCostItem);
      toast({ title: 'Sucesso', description: 'Custo excluído.' });
      setDeletingCostItem(undefined);
  };

  const openRevenueDialogForEdit = (revenue: RevenueItem) => {
      setEditingRevenueItem(revenue);
      setRevenueDialogOpen(true);
  }
  const openRevenueDialogForCreate = () => {
      setEditingRevenueItem(undefined);
      setRevenueDialogOpen(true);
  }
  const handleReceiveRevenueItem = async (revenue: RevenueItem) => {
      if (!user || !firestore) return;
      await receiveRevenueItem(firestore, user.uid, revenue);
      toast({ title: 'Sucesso!', description: 'Conta marcada como recebida.' });
  }
  const handleDeleteRevenueConfirm = async () => {
      if (!deletingRevenueItem || !user || !firestore) return;
      await deleteRevenueItem(firestore, user.uid, deletingRevenueItem);
      toast({ title: 'Sucesso', description: 'Receita excluída.' });
      setDeletingRevenueItem(undefined);
  };

  // --- Status Logic ---
  const getCostStatus = (cost: CostItem): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
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

  const getRevenueStatus = (revenue: RevenueItem): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
    if (revenue.receivedAmount > 0) {
        return { label: 'Recebido', variant: 'secondary' };
    }
    const transactionDate = new Date(revenue.transactionDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    if (transactionDate < today) {
        return { label: 'Atrasado', variant: 'destructive' };
    }
    return { label: 'Pendente', variant: 'default' };
  }

  const actualTotalRevenue = revenues?.reduce((acc, item) => acc + item.receivedAmount, 0) || 0;
  const actualTotalCost = costs?.reduce((acc, item) => acc + item.actualAmount, 0) || 0;
  const actualProfit = actualTotalRevenue - actualTotalCost;
  const marginPercentage = actualTotalRevenue > 0 ? (actualProfit / actualTotalRevenue) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return <div>Projeto não encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">Cliente: {project.client}</p>
          <Badge variant={statusVariant[project.status]} className="mt-2">{project.status}</Badge>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {project.status !== 'Concluído' && project.status !== 'Cancelado' && (
                <Button size="sm" variant="secondary" onClick={handleCompleteProject}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Concluir Projeto
                </Button>
            )}
            <Button size="sm" onClick={() => setProjectDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar Projeto
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KeyMetricCard title="Valor Total (R$)" value={formatCurrency(project.plannedTotalRevenue)} Icon={DollarSign} isLoading={false} />
        <KeyMetricCard title="Custo Estimado (R$)" value={formatCurrency(project.plannedTotalCost)} Icon={Wallet} isLoading={false} isNegative />
        <KeyMetricCard title="Receita Realizada (R$)" value={formatCurrency(actualTotalRevenue)} Icon={TrendingUp} isLoading={false} />
        <KeyMetricCard title="Custos Realizados (R$)" value={formatCurrency(actualTotalCost)} Icon={TrendingDown} isLoading={false} isNegative />
        <KeyMetricCard title="Margem Real (R$)" value={formatCurrency(actualProfit)} Icon={Activity} isLoading={false} isNegative={actualProfit < 0} />
        <KeyMetricCard title="Margem Real (%)" value={`${marginPercentage.toFixed(1)}%`} Icon={Percent} isLoading={false} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Receitas do Projeto</CardTitle>
          <Button size="sm" onClick={openRevenueDialogForCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Receita
          </Button>
        </CardHeader>
        <CardContent>
          <div className="md:hidden space-y-4">
            {revenues?.map(r => {
                const { label, variant } = getRevenueStatus(r);
                const isPaid = label === 'Recebido';
                return (
                  <Card key={r.id}>
                    <CardContent className="p-4 space-y-2">
                       <div className="flex justify-between items-start">
                        <p className="font-semibold">{r.name}</p>
                        <Badge variant={variant}>{label}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Previsto: <span className="font-medium text-foreground">{formatCurrency(r.plannedAmount)}</span></p>
                        <p>Recebido: <span className="font-medium text-foreground">{formatCurrency(r.receivedAmount)}</span></p>
                      </div>
                       <div className="flex items-center justify-end gap-2 pt-2">
                        {!isPaid && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => handleReceiveRevenueItem(r)}
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
                            <DropdownMenuItem onClick={() => openRevenueDialogForEdit(r)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingRevenueItem(r)}>
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                )
            })}
             {revenues?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma receita encontrada.</p>}
          </div>
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Previsto</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenues?.map(r => {
                const { label, variant } = getRevenueStatus(r);
                const isPaid = label === 'Recebido';
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell><Badge variant={variant}>{label}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(r.plannedAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.receivedAmount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isPaid && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => handleReceiveRevenueItem(r)}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Receber
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openRevenueDialogForEdit(r)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingRevenueItem(r)}>
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
               {revenues?.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma receita encontrada.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Custos do Projeto</CardTitle>
          <Button size="sm" onClick={openCostDialogForCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Custo
          </Button>
        </CardHeader>
        <CardContent>
           <div className="md:hidden space-y-4">
              {costs?.map(c => {
                 const { label, variant } = getCostStatus(c);
                 const isPaid = label === 'Pago';
                 return (
                   <Card key={c.id}>
                      <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                              <div>
                                  <p className="font-semibold">{c.name}</p>
                                  <Badge variant="outline">{c.category}</Badge>
                              </div>
                              <Badge variant={variant}>{label}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                              <p>Previsto: <span className="font-medium text-foreground">{formatCurrency(c.plannedAmount)}</span></p>
                              <p>Real: <span className="font-medium text-foreground">{formatCurrency(c.actualAmount)}</span></p>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-2">
                              {!isPaid && (
                                  <Button variant="outline" size="sm" className="h-8" onClick={() => handlePayCostItem(c)}>
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
                                      <DropdownMenuItem onClick={() => openCostDialogForEdit(c)}>Editar</DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingCostItem(c)}>
                                          Excluir
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                      </CardContent>
                   </Card>
                 )
              })}
              {costs?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum custo encontrado.</p>}
           </div>
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Previsto</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs?.map(c => {
                 const { label, variant } = getCostStatus(c);
                 const isPaid = label === 'Pago';
                 return (
                   <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                    <TableCell><Badge variant={variant}>{label}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(c.plannedAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.actualAmount)}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                        {!isPaid && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => handlePayCostItem(c)}
                          >
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
                            <DropdownMenuItem onClick={() => openCostDialogForEdit(c)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingCostItem(c)}>
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {costs?.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhum custo encontrado.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {isCostDialogOpen && project && (
         <CostItemDialog 
            isOpen={isCostDialogOpen}
            onOpenChange={(isOpen) => {
                setCostDialogOpen(isOpen);
                if (!isOpen) setEditingCostItem(undefined);
            }}
            projects={[project]}
            costItem={editingCostItem}
         />
      )}
      
      {isRevenueDialogOpen && project && (
         <RevenueItemDialog 
            isOpen={isRevenueDialogOpen}
            onOpenChange={(isOpen) => {
                setRevenueDialogOpen(isOpen);
                if (!isOpen) setEditingRevenueItem(undefined);
            }}
            projects={[project]}
            revenueItem={editingRevenueItem}
         />
      )}
      
      {isProjectDialogOpen && (
        <ProjectDialog 
            isOpen={isProjectDialogOpen}
            onOpenChange={setProjectDialogOpen}
            project={project}
        />
      )}

      {deletingCostItem && <DeleteAlertDialog
        isOpen={!!deletingCostItem}
        onOpenChange={(isOpen) => !isOpen && setDeletingCostItem(undefined)}
        onConfirm={handleDeleteCostConfirm}
        title="Tem certeza que deseja excluir este custo?"
        description="Esta ação não pode ser desfeita e irá remover permanentemente o custo."
      />}

      {deletingRevenueItem && <DeleteAlertDialog
        isOpen={!!deletingRevenueItem}
        onOpenChange={(isOpen) => !isOpen && setDeletingRevenueItem(undefined)}
        onConfirm={handleDeleteRevenueConfirm}
        title="Tem certeza que deseja excluir esta receita?"
        description="Esta ação não pode ser desfeita e irá remover permanentemente a receita."
      />}

    </div>
  );
}

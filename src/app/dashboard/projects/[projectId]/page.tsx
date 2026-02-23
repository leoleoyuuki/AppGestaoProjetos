'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import KeyMetricCard from '@/components/dashboard/overview/key-metric-card';
import { formatCurrency } from '@/lib/utils';
import type { Project, CostItem, RevenueItem } from '@/lib/types';
import { PlusCircle, DollarSign, Wallet, Activity, Percent, TrendingUp, TrendingDown } from 'lucide-react';
import { CostItemDialog } from '@/components/dashboard/cost-item-dialog';
import { RevenueItemDialog } from '@/components/dashboard/revenue-item-dialog';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [isCostDialogOpen, setCostDialogOpen] = useState(false);
  const [isRevenueDialogOpen, setRevenueDialogOpen] = useState(false);

  const projectRef = useMemoFirebase(() => {
    if (!user || !firestore || !projectId) return null;
    return doc(firestore, `users/${user.uid}/projects`, projectId);
  }, [firestore, user, projectId]);
  const { data: project, isLoading: projectLoading } = useDoc<Project>(projectRef);

  const costsQuery = useMemoFirebase(() => {
    if (!projectRef) return null;
    return query(collection(projectRef, 'costItems'));
  }, [projectRef]);
  const { data: costs, isLoading: costsLoading } = useCollection<CostItem>(costsQuery);
  
  const revenuesQuery = useMemoFirebase(() => {
    if (!projectRef) return null;
    return query(collection(projectRef, 'revenueItems'));
  }, [projectRef]);
  const { data: revenues, isLoading: revenuesLoading } = useCollection<RevenueItem>(revenuesQuery);

  const isLoading = projectLoading || costsLoading || revenuesLoading;

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
      <div>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground">Cliente: {project.client}</p>
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
          <Button size="sm" onClick={() => setRevenueDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Receita
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Previsto</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenues?.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell><Badge variant={r.receivedAmount > 0 ? 'secondary' : 'default'}>{r.receivedAmount > 0 ? 'Recebido' : 'Pendente'}</Badge></TableCell>
                  <TableCell className="text-right">{formatCurrency(r.plannedAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.receivedAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Custos do Projeto</CardTitle>
          <Button size="sm" onClick={() => setCostDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Custo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Previsto</TableHead>
                <TableHead className="text-right">Real</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs?.map(c => (
                 <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                  <TableCell className="text-right">{formatCurrency(c.plannedAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.actualAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {isCostDialogOpen && (
         <CostItemDialog 
            isOpen={isCostDialogOpen}
            onOpenChange={setCostDialogOpen}
            projects={[project]}
            costItem={undefined}
         />
      )}
      
      {isRevenueDialogOpen && (
         <RevenueItemDialog 
            isOpen={isRevenueDialogOpen}
            onOpenChange={setRevenueDialogOpen}
            projects={[project]}
            revenueItem={undefined}
         />
      )}

    </div>
  );
}

'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, collection } from 'firebase/firestore';
import type { CostItem, RevenueItem, Project, Transaction } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CashflowTab() {
  const { user } = useUser();
  const firestore = useFirestore();

  const costsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/costItems`));
  }, [firestore, user]);
  const { data: costs, isLoading: costsLoading } = useCollection<CostItem>(costsQuery);

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

  const transactions: Transaction[] = useMemo(() => {
    if (!costs || !revenues || !projects || !user) return [];
    
    const userRevenues = revenues.filter(r => r.userId === user.uid);

    const revenueTransactions = userRevenues.map(r => ({
      id: `trans-rev-${r.id}`,
      type: 'Receita' as const,
      description: r.name,
      amount: r.receivedAmount > 0 ? r.receivedAmount : r.plannedAmount,
      date: r.transactionDate,
      category: 'Receita' as const,
      project: projects.find(p => p.id === r.projectId)?.name || 'N/A',
      status: r.receivedAmount > 0 ? 'Recebido' as const : 'Pendente' as const,
    }));

    const costTransactions = costs.map(c => ({
      id: `trans-cost-${c.id}`,
      type: 'Custo' as const,
      description: c.name,
      amount: c.actualAmount > 0 ? c.actualAmount : c.plannedAmount,
      date: c.transactionDate,
      category: c.category,
      project: projects.find(p => p.id === c.projectId)?.name || 'N/A',
      status: c.actualAmount > 0 ? 'Pago' as const : 'Pendente' as const,
    }));

    return [...revenueTransactions, ...costTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [costs, revenues, projects, user]);
  
  const isLoading = costsLoading || revenuesLoading || projectsLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
          <CardDescription>Visão consolidada de todas as entradas e saídas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
             <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Filtrar por data</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="range" />
              </PopoverContent>
            </Popover>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
                <SelectItem value="labor">Mão de obra</SelectItem>
                <SelectItem value="materials">Materiais</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Projeto" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">Todos os Projetos</SelectItem>
                 {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
             <Button variant="outline"><Filter className="mr-2 h-4 w-4"/> Aplicar Filtros</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead className="text-right">Valor</TableHead>
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
              {!isLoading && transactions.map(transaction => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'Receita' ? 'secondary' : 'destructive'} className="gap-1">
                      {transaction.type === 'Receita' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.project}</TableCell>
                  <TableCell className={`text-right font-semibold ${transaction.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

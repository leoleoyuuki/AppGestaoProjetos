'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp, Calendar as CalendarIcon, Filter, DollarSign, TrendingUp, TrendingDown, Landmark } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collectionGroup, query, collection, doc } from 'firebase/firestore';
import type { CostItem, RevenueItem, Project, Transaction, CostCategory, UserProfile } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import KeyMetricCard from '@/components/dashboard/overview/key-metric-card';
import Link from 'next/link';

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

  const costCategoriesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/costCategories`));
  }, [firestore, user]);
  const { data: costCategories } = useCollection<CostCategory>(costCategoriesQuery);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: userProfileLoading } = useDoc<UserProfile>(userProfileRef);

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
  
  const isLoading = costsLoading || revenuesLoading || projectsLoading || userProfileLoading;

  const { initialBalance, totalRevenue, totalCost, currentBalance } = useMemo(() => {
    if (isLoading || !userProfile || !costs || !revenues || !user) {
        return { initialBalance: 0, totalRevenue: 0, totalCost: 0, currentBalance: 0 };
    }
    
    const initialBalanceValue = userProfile.initialCashBalance || 0;

    const userRevenues = revenues.filter(r => r.userId === user.uid);
    const totalRevenueValue = userRevenues.reduce((acc, r) => acc + r.receivedAmount, 0);

    const totalCostValue = costs.reduce((acc, c) => acc + c.actualAmount, 0);

    const currentBalanceValue = initialBalanceValue + totalRevenueValue - totalCostValue;

    return { 
        initialBalance: initialBalanceValue, 
        totalRevenue: totalRevenueValue, 
        totalCost: totalCostValue, 
        currentBalance: currentBalanceValue 
    };
  }, [isLoading, userProfile, costs, revenues, user]);


  return (
    <div className="space-y-6">
       {!isLoading && (!userProfile || !userProfile.initialCashBalance) && (
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao Fluxo de Caixa!</CardTitle>
            <CardDescription>
              Para começar, informe seu saldo inicial. Isso é essencial para calcular
              o saldo atual da sua empresa com precisão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/settings">
                <Landmark className="mr-2 h-4 w-4" />
                Definir Saldo Inicial
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KeyMetricCard title="Saldo Inicial" value={formatCurrency(initialBalance)} Icon={Landmark} isLoading={isLoading} />
            <KeyMetricCard title="Total de Entradas" value={formatCurrency(totalRevenue)} Icon={TrendingUp} isLoading={isLoading} />
            <KeyMetricCard title="Total de Saídas" value={formatCurrency(totalCost)} Icon={TrendingDown} isLoading={isLoading} isNegative />
            <KeyMetricCard title="Saldo Atual" value={formatCurrency(currentBalance)} Icon={DollarSign} isLoading={isLoading} isNegative={currentBalance < 0} />
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
          <CardDescription>Visão consolidada de todas as entradas e saídas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mb-4">
             <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full md:w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Filtrar por data</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="range" />
              </PopoverContent>
            </Popover>
            <Select>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
                {costCategories?.map(cat => (
                   <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Projeto" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">Todos os Projetos</SelectItem>
                 {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
             <Button variant="outline" className="w-full md:w-auto"><Filter className="mr-2 h-4 w-4"/> Aplicar Filtros</Button>
          </div>
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {isLoading && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            {!isLoading && transactions.map(transaction => (
                <Card key={transaction.id}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <p className="font-medium">{transaction.description}</p>
                            <Badge variant={transaction.type === 'Receita' ? 'secondary' : 'destructive'} className="gap-1 whitespace-nowrap">
                              {transaction.type === 'Receita' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              {transaction.type}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                            <div className="text-sm text-muted-foreground">
                                <p>{new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                <p>{transaction.project}</p>
                            </div>
                            <p className={`font-semibold ${transaction.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(transaction.amount)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
             {!isLoading && transactions.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">Nenhuma transação encontrada.</p>}
          </div>
          {/* Desktop View */}
          <Table className="hidden md:table">
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
                  <TableCell>{new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
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
               {!isLoading && transactions.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma transação encontrada.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

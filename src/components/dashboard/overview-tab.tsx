'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PlusCircle,
  Calendar as CalendarIcon,
  DollarSign,
  Wallet,
  Activity,
  Briefcase,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { ProjectDialog } from './project-dialog';
import KeyMetricCard from './overview/key-metric-card';
import ProjectList from './overview/project-list';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import type { Project, CostItem, RevenueItem } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';
import MonthlyIOChart from './overview/monthly-io-chart';

export default function OverviewTab() {
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());

  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch all data needed for the dashboard
  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/projects`));
  }, [firestore, user]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const costsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collectionGroup(firestore, 'costItems'));
  }, [firestore, user]);
  const { data: costs, isLoading: costsLoading } = useCollection<CostItem>(costsQuery);

  const revenuesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collectionGroup(firestore, 'revenueItems'));
  }, [firestore, user]);
  const { data: revenues, isLoading: revenuesLoading } = useCollection<RevenueItem>(revenuesQuery);

  const isLoading = projectsLoading || costsLoading || revenuesLoading;

  // Memoize calculations
  const monthlyMetrics = useMemo(() => {
    if (isLoading || !costs || !revenues || !user) return { revenue: 0, cost: 0, result: 0 };

    const userCosts = costs.filter(c => c.userId === user.uid);
    const userRevenues = revenues.filter(r => r.userId === user.uid);

    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const monthlyRevenues = userRevenues.filter(r =>
      isWithinInterval(new Date(r.transactionDate), { start: monthStart, end: monthEnd })
    );
    const monthlyCosts = userCosts.filter(c =>
      isWithinInterval(new Date(c.transactionDate), { start: monthStart, end: monthEnd })
    );

    const totalRevenue = monthlyRevenues.reduce((acc, r) => acc + (r.receivedAmount || 0), 0);
    const totalCost = monthlyCosts.reduce((acc, c) => acc + (c.actualAmount || 0), 0);

    return {
      revenue: totalRevenue,
      cost: totalCost,
      result: totalRevenue - totalCost,
    };
  }, [date, costs, revenues, user, isLoading]);

  const projectsInProgress = useMemo(() => {
    if (isLoading || !projects) return 0;
    return projects.filter(p => p.status === 'Em andamento').length;
  }, [projects, isLoading]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral financeira do seu negócio.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[240px] justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? (
                  <span className="capitalize">{format(date, "MMMM 'de' yyyy", { locale: ptBR })}</span>
                ) : (
                  <span>Escolha um mês</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={d => setDate(d || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => setProjectDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KeyMetricCard
          title="Receita no Mês"
          value={formatCurrency(monthlyMetrics.revenue)}
          subText={`Em ${format(date, 'MMMM', { locale: ptBR })}`}
          Icon={DollarSign}
          isLoading={isLoading}
        />
        <KeyMetricCard
          title="Custo no Mês"
          value={formatCurrency(monthlyMetrics.cost)}
          subText={`Em ${format(date, 'MMMM', { locale: ptBR })}`}
          Icon={Wallet}
          isLoading={isLoading}
        />
        <KeyMetricCard
          title="Resultado do Mês"
          value={formatCurrency(monthlyMetrics.result)}
          subText={`Em ${format(date, 'MMMM', { locale: ptBR })}`}
          Icon={Activity}
          isLoading={isLoading}
          isNegative={monthlyMetrics.result < 0}
        />
        <KeyMetricCard
          title="Projetos em Andamento"
          value={String(projectsInProgress)}
          subText="Total de projetos ativos"
          Icon={Briefcase}
          isLoading={isLoading}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Entradas x Saídas (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <MonthlyIOChart costs={costs} revenues={revenues} isLoading={isLoading} userId={user?.uid} />
          </CardContent>
        </Card>
        <ProjectList />
      </div>
      <ProjectDialog isOpen={isProjectDialogOpen} onOpenChange={setProjectDialogOpen} />
    </>
  );
}

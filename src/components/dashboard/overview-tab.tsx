'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Briefcase } from 'lucide-react';
import ProjectsTable from './projects-table';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import type { Project, RevenueItem, FixedCost } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';


const KeyMetricCard = ({ title, value, icon: Icon, trend, isLoading }: { title: string; value: string; icon: React.ElementType; trend?: string, isLoading?: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="h-8 w-24 mt-1" /> : <div className="text-2xl font-bold">{value}</div>}
      {trend && !isLoading && <p className="text-xs text-muted-foreground">{trend}</p>}
    </CardContent>
  </Card>
);

export default function OverviewTab() {
  const { user } = useUser();
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'projects'));
  }, [firestore, user]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const revenueItemsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // Note: This requires a composite index on (userId, receivedAmount) in Firestore.
    return query(collectionGroup(firestore, 'revenueItems'), where('userId', '==', user.uid), where('receivedAmount', '==', 0));
  }, [firestore, user]);
  const { data: pendingRevenues, isLoading: revenuesLoading } = useCollection<RevenueItem>(revenueItemsQuery);
  
  const fixedCostsQuery = useMemoFirebase(() => {
    if(!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'fixedCosts'));
  }, [firestore, user]);
  const { data: fixedCosts, isLoading: fixedCostsLoading } = useCollection<FixedCost>(fixedCostsQuery);

  const activeProjects = projects?.filter(p => p.status === 'Em andamento').length || 0;

  const totalPredictedProfit = projects?.reduce((acc, proj) => acc + (proj.plannedTotalRevenue - proj.plannedTotalCost), 0) || 0;

  const totalActualProfit = projects?.reduce((acc, proj) => acc + (proj.actualTotalRevenue - proj.actualTotalCost), 0) || 0;
  
  const pendingRevenue = pendingRevenues?.reduce((acc, r) => acc + r.plannedAmount, 0) || 0;
  
  const isLoading = projectsLoading || revenuesLoading || fixedCostsLoading;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KeyMetricCard title="Projetos Ativos" value={activeProjects.toString()} icon={Briefcase} isLoading={isLoading} />
        <KeyMetricCard title="Lucro Previsto" value={formatCurrency(totalPredictedProfit)} icon={TrendingUp} isLoading={isLoading}/>
        <KeyMetricCard title="Lucro Real" value={formatCurrency(totalActualProfit)} icon={totalActualProfit > totalPredictedProfit ? TrendingUp : TrendingDown} isLoading={isLoading}/>
        <KeyMetricCard title="Receita Pendente" value={formatCurrency(pendingRevenue)} icon={DollarSign} isLoading={isLoading}/>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Todos os Projetos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectsTable />
        </CardContent>
      </Card>
    </div>
  );
}

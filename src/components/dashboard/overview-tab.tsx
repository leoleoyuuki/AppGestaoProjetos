import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { projects, costs, revenues } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Briefcase } from 'lucide-react';
import ProjectsTable from './projects-table';

const KeyMetricCard = ({ title, value, icon: Icon, trend }: { title: string; value: string; icon: React.ElementType; trend?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
    </CardContent>
  </Card>
);

export default function OverviewTab() {
  const activeProjects = projects.filter(p => p.status === 'Em andamento').length;

  const totalPredictedProfit = projects.reduce((acc, proj) => {
    const projRevenues = revenues.filter(r => r.projectId === proj.id).reduce((sum, r) => sum + r.predictedAmount, 0);
    const projCosts = costs.filter(c => c.projectId === proj.id).reduce((sum, c) => sum + c.predictedAmount, 0);
    return acc + (projRevenues - projCosts);
  }, 0);

  const totalActualProfit = projects.reduce((acc, proj) => {
    const projRevenues = revenues.filter(r => r.projectId === proj.id).reduce((sum, r) => sum + r.actualAmount, 0);
    const projCosts = costs.filter(c => c.projectId === proj.id).reduce((sum, c) => sum + c.actualAmount, 0);
    return acc + (projRevenues - projCosts);
  }, 0);

  const monthlyFixedCosts = costs
    .filter(c => c.isRecurring)
    .reduce((acc, cost) => acc + cost.predictedAmount, 0);
  
  const pendingRevenue = revenues
    .filter(r => r.actualAmount === 0)
    .reduce((acc, r) => acc + r.predictedAmount, 0);


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KeyMetricCard title="Projetos Ativos" value={activeProjects.toString()} icon={Briefcase} />
        <KeyMetricCard title="Lucro Previsto" value={formatCurrency(totalPredictedProfit)} icon={TrendingUp} />
        <KeyMetricCard title="Lucro Real" value={formatCurrency(totalActualProfit)} icon={totalActualProfit > totalPredictedProfit ? TrendingUp : TrendingDown} />
        <KeyMetricCard title="Receita Pendente" value={formatCurrency(pendingRevenue)} icon={DollarSign} />
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

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CostPieChart from '../charts/cost-pie-chart';
import RevenueBarChart from '../charts/revenue-bar-chart';

export default function ReportsTab() {
  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Custos</CardTitle>
          <CardDescription>Distribuição percentual dos custos totais por categoria.</CardDescription>
        </CardHeader>
        <CardContent>
          <CostPieChart />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Receita: Previsto vs. Real</CardTitle>
          <CardDescription>Comparação da receita prevista com a receita real por projeto.</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueBarChart />
        </CardContent>
      </Card>
    </div>
  );
}

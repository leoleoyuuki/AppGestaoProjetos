'use client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { ProjectDialog } from './project-dialog';
import KeyMetricCard from './overview/key-metric-card';
import ProjectAnalyticsChart from './overview/project-analytics-chart';
import RemindersCard from './overview/reminders-card';
import ProjectList from './overview/project-list';
import ProjectProgressChart from './overview/project-progress-chart';


export default function OverviewTab() {
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso e as finanças do seu projeto.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button onClick={() => setProjectDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Project
          </Button>
           <Button variant="outline">
            Import Data
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KeyMetricCard title="Projetos Ativos" statusKey="Em andamento" isPrimary/>
        <KeyMetricCard title="Projetos Concluídos" statusKey="Concluído"/>
        <KeyMetricCard title="Lucro Real" isProfit />
        <KeyMetricCard title="Receita Pendente" isPendingRevenue/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProjectAnalyticsChart />
          <ProjectList />
        </div>
        <div className="space-y-6">
           <RemindersCard />
           <ProjectProgressChart />
        </div>
      </div>
      <ProjectDialog isOpen={isProjectDialogOpen} onOpenChange={setProjectDialogOpen} />
    </>
  );
}

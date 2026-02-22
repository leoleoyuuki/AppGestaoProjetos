import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { projects, costs, revenues } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import type { ProjectStatus } from '@/lib/types';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const statusVariant: { [key in ProjectStatus]: 'default' | 'secondary' | 'destructive' } = {
  'Em andamento': 'default',
  'Concluído': 'secondary',
  'Cancelado': 'destructive',
};

export default function ProjectsTable() {
  const projectData = projects.map(proj => {
    const projCosts = costs.filter(c => c.projectId === proj.id);
    const projRevenues = revenues.filter(r => r.projectId === proj.id);

    const totalPredictedRevenue = projRevenues.reduce((sum, r) => sum + r.predictedAmount, 0);
    const totalActualRevenue = projRevenues.reduce((sum, r) => sum + r.actualAmount, 0);

    const totalPredictedCost = projCosts.reduce((sum, c) => sum + c.predictedAmount, 0);
    const totalActualCost = projCosts.reduce((sum, c) => sum + c.actualAmount, 0);
    
    const predictedProfit = totalPredictedRevenue - totalPredictedCost;
    const actualProfit = totalActualRevenue - totalActualCost;

    const progress = totalPredictedRevenue > 0 ? (totalActualRevenue / totalPredictedRevenue) * 100 : 0;

    return {
      ...proj,
      predictedProfit,
      actualProfit,
      progress,
    };
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Projeto</TableHead>
          <TableHead className="hidden md:table-cell">Status</TableHead>
          <TableHead className="hidden lg:table-cell">Progresso</TableHead>
          <TableHead className="text-right">Lucro Previsto</TableHead>
          <TableHead className="text-right hidden md:table-cell">Lucro Real</TableHead>
          <TableHead><span className="sr-only">Ações</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projectData.map(proj => (
          <TableRow key={proj.id}>
            <TableCell>
              <div className="font-medium">{proj.name}</div>
              <div className="text-sm text-muted-foreground hidden sm:inline">{proj.client}</div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant={statusVariant[proj.status]}>{proj.status}</Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <div className="flex items-center gap-2">
                <Progress value={proj.progress} className="h-2" />
                <span className="text-xs text-muted-foreground">{Math.round(proj.progress)}%</span>
              </div>
            </TableCell>
            <TableCell className="text-right">{formatCurrency(proj.predictedProfit)}</TableCell>
            <TableCell className="text-right hidden md:table-cell">{formatCurrency(proj.actualProfit)}</TableCell>
            <TableCell>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                  <DropdownMenuItem>Editar Projeto</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

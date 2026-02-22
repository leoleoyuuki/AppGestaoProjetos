import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { revenues, projects } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import type { PaymentMethod } from '@/lib/types';

const paymentMethodVariant: { [key in PaymentMethod]: 'default' | 'secondary' | 'outline' } = {
  'Cartão de Crédito': 'default',
  'Transferência Bancária': 'secondary',
  'Dinheiro': 'outline',
};

export default function RevenueTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Todas as Receitas</CardTitle>
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Receita
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Previsto</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenues.map(revenue => {
                const project = projects.find(p => p.id === revenue.projectId);
                const status = revenue.actualAmount > 0 ? 'Recebido' : 'Pendente';
                return (
                  <TableRow key={revenue.id}>
                    <TableCell className="font-medium">{revenue.description}</TableCell>
                    <TableCell>{project?.name}</TableCell>
                    <TableCell>
                      <Badge variant={status === 'Recebido' ? 'secondary' : 'default'}>{status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={paymentMethodVariant[revenue.paymentMethod]}>{revenue.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(revenue.predictedAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(revenue.actualAmount)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

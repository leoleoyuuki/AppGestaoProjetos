'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { FixedCost } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FixedCostDialog } from './fixed-cost-dialog';
import { DeleteAlertDialog } from '../ui/delete-alert-dialog';
import { deleteFixedCost, generateCostItemFromFixedCost } from '@/lib/actions';

export default function FixedCostsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | undefined>(undefined);
  const [deletingCost, setDeletingCost] = useState<FixedCost | undefined>(undefined);

  const { user } = useUser();
  const firestore = useFirestore();

  const fixedCostsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/fixedCosts`));
  }, [firestore, user]);
  const { data: fixedCosts, isLoading } = useCollection<FixedCost>(fixedCostsQuery);

  const handleDeleteConfirm = () => {
    if (!deletingCost || !user) return;
    deleteFixedCost(firestore, user.uid, deletingCost.id);
    toast({ title: 'Sucesso', description: 'Custo fixo excluído.' });
    setDeletingCost(undefined);
  };
  
  const handleGenerateCostItem = (cost: FixedCost) => {
    if (!user) return;
    generateCostItemFromFixedCost(firestore, user.uid, cost);
    toast({ title: 'Sucesso!', description: `Lançamento para "${cost.name}" gerado em Contas a Pagar.` });
  }

  const openDialogForEdit = (cost: FixedCost) => {
    setEditingCost(cost);
    setDialogOpen(true);
  }

  const openDialogForCreate = () => {
    setEditingCost(undefined);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Custos Fixos</h1>
        <Button size="sm" onClick={openDialogForCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Custo Fixo
        </Button>
      </div>

       <Card>
          <CardHeader>
              <CardTitle>Gerenciamento de Custos Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor Mensal (R$)</TableHead>
                  <TableHead>Próximo Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && fixedCosts && fixedCosts.map(cost => {
                  return (
                    <TableRow key={cost.id}>
                      <TableCell className="font-medium">{cost.name}</TableCell>
                      <TableCell><Badge variant="outline">{cost.category}</Badge></TableCell>
                      <TableCell className="text-right">{formatCurrency(cost.amount)}</TableCell>
                      <TableCell>{new Date(cost.nextPaymentDate).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="truncate max-w-xs">{cost.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleGenerateCostItem(cost)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Gerar Lançamento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialogForEdit(cost)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingCost(cost)}>
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {!isLoading && (!fixedCosts || fixedCosts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Nenhum custo fixo encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
      </Card>

      {isDialogOpen && (
         <FixedCostDialog 
            isOpen={isDialogOpen}
            onOpenChange={setDialogOpen}
            fixedCost={editingCost}
         />
      )}
      {deletingCost && <DeleteAlertDialog
        isOpen={!!deletingCost}
        onOpenChange={(isOpen) => !isOpen && setDeletingCost(undefined)}
        onConfirm={handleDeleteConfirm}
        title="Tem certeza que deseja excluir este custo fixo?"
        description="Esta ação não pode ser desfeita. O custo não será mais listado para futuros lançamentos."
      />}
    </div>
  );
}

"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, AlertCircle, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DeviationAssistantDialog from './deviation-assistant-dialog';
import { analyzeDeviation, type AnalyzeDeviationOutput, type AnalyzeDeviationInput } from "@/ai/flows/deviation-analysis-assistant";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, collection } from 'firebase/firestore';
import type { CostItem, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CostItemDialog } from './cost-item-dialog';
import { DeleteAlertDialog } from '../ui/delete-alert-dialog';
import { deleteCostItem } from '@/lib/actions';

export default function CostsTab() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDeviationOutput | null>(null);
  const [isDeviationDialogOpen, setDeviationDialogOpen] = useState(false);
  const [isCostItemDialogOpen, setCostItemDialogOpen] = useState(false);
  const [editingCostItem, setEditingCostItem] = useState<CostItem | undefined>(undefined);
  const [deletingCostItem, setDeletingCostItem] = useState<CostItem | undefined>(undefined);

  const { user } = useUser();
  const firestore = useFirestore();

  const costsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collectionGroup(firestore, 'costItems'));
  }, [firestore, user]);
  const { data: costs, isLoading: costsLoading } = useCollection<CostItem>(costsQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/projects`));
  }, [firestore, user]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const handleAnalysis = async (projectId: string) => {
     if (!projects || !costs) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      toast({ variant: "destructive", title: "Erro", description: "Projeto não encontrado." });
      return;
    }

    const projectName = project.name;
    toast({
      title: "Analisando desvios...",
      description: `Executando análise de IA para ${projectName}.`
    });

    const projectCosts = costs.filter((c) => c.projectId === projectId);
  
    const predictedCost = projectCosts.reduce((acc, cost) => acc + cost.plannedAmount, 0);
    const actualCost = projectCosts.reduce((acc, cost) => acc + cost.actualAmount, 0);

    if (predictedCost === 0) {
      toast({ title: "Análise não disponível", description: "Custo previsto é zero."});
      return;
    }

    const input: AnalyzeDeviationInput = {
      projectName: project.name,
      predictedCost,
      actualCost,
      deviationThresholdPercentage: 10,
      projectDescription: `Análise de custos para o projeto ${project.name}, com início em ${project.startDate} e fim previsto para ${project.endDate}.`,
      costCategories: projectCosts.map(cost => ({
        category: cost.category,
        predicted: cost.plannedAmount,
        actual: cost.actualAmount,
      })),
    };

    try {
      const result = await analyzeDeviation(input); 
      if (result) {
        if(result.isSignificantDeviation) {
          setAnalysisResult(result);
          setDeviationDialogOpen(true);
        } else {
          toast({
            title: "Análise Concluída",
            description: `Nenhum desvio significativo encontrado para ${projectName}.`,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro na Análise",
          description: "Não foi possível executar a análise de desvio.",
        });
      }
    } catch (error) {
      console.error("Error running deviation analysis:", error);
      toast({
        variant: "destructive",
        title: "Erro na Análise",
        description: "Ocorreu um erro ao executar a análise.",
      });
    }
  };

  const getDeviationStatus = (cost: CostItem) => {
    if (cost.actualAmount === 0 || cost.plannedAmount === 0) return null;
    const deviation = (cost.actualAmount - cost.plannedAmount) / cost.plannedAmount;
    if (Math.abs(deviation) > 0.1) {
      return {
        isOver: deviation > 0,
        percentage: Math.abs(deviation) * 100
      };
    }
    return null;
  }

  const getProjectName = (projectId: string) => {
    return projects?.find(p => p.id === projectId)?.name;
  };

  const handleDeleteConfirm = () => {
    if (!deletingCostItem || !user) return;
    deleteCostItem(firestore, user.uid, deletingCostItem.projectId, deletingCostItem.id);
    toast({ title: 'Sucesso', description: 'Custo excluído.' });
    setDeletingCostItem(undefined);
  };
  
  const userCosts = costs?.filter(cost => cost.userId === user?.uid);
  const isLoading = costsLoading || projectsLoading;

  const openDialogForEdit = (cost: CostItem) => {
    setEditingCostItem(cost);
    setCostItemDialogOpen(true);
  }

  const openDialogForCreate = () => {
    setEditingCostItem(undefined);
    setCostItemDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Todos os Custos</CardTitle>
          <Button size="sm" onClick={openDialogForCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Custo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Previsto</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="text-center">Desvio</TableHead>
                <TableHead className="text-right"><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && userCosts?.map(cost => {
                const deviation = getDeviationStatus(cost);
                return (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">{cost.name}</TableCell>
                    <TableCell>{getProjectName(cost.projectId)}</TableCell>
                    <TableCell><Badge variant="outline">{cost.category}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(cost.plannedAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cost.actualAmount)}</TableCell>
                    <TableCell className="text-center">
                      {deviation ? (
                        <Badge variant={deviation.isOver ? "destructive" : "secondary"}>
                          {deviation.isOver ? '▲' : '▼'} {deviation.percentage.toFixed(0)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDialogForEdit(cost)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAnalysis(cost.projectId)}>
                             Analisar Desvio
                           </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingCostItem(cost)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <DeviationAssistantDialog
        isOpen={isDeviationDialogOpen}
        setOpen={setDeviationDialogOpen}
        analysisResult={analysisResult}
      />
      {(isCostItemDialogOpen || editingCostItem) && projects && (
         <CostItemDialog 
            isOpen={isCostItemDialogOpen}
            onOpenChange={setCostItemDialogOpen}
            projects={projects}
            costItem={editingCostItem}
         />
      )}
      {deletingCostItem && (
        <DeleteAlertDialog
          isOpen={!!deletingCostItem}
          onOpenChange={(isOpen) => !isOpen && setDeletingCostItem(undefined)}
          onConfirm={handleDeleteConfirm}
          title="Tem certeza que deseja excluir este custo?"
          description="Esta ação não pode ser desfeita e irá remover permanentemente o item de custo."
        />
      )}
    </div>
  );
}

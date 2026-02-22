"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { costs, projects, type Cost } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { MoreHorizontal, PlusCircle, AlertCircle } from 'lucide-react';
import { runDeviationAnalysis } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import DeviationAssistantDialog from './deviation-assistant-dialog';
import type { AnalyzeDeviationOutput } from '@/ai/flows/deviation-analysis-assistant';

export default function CostsTab() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDeviationOutput | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);

  const handleAnalysis = async (projectId: string) => {
    const projectName = projects.find(p => p.id === projectId)?.name || "Projeto";
    toast({
      title: "Analisando desvios...",
      description: `Executando análise de IA para ${projectName}.`
    });
    const result = await runDeviationAnalysis(projectId);
    if (result) {
      if(result.isSignificantDeviation) {
        setAnalysisResult(result);
        setDialogOpen(true);
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
  };

  const getDeviationStatus = (cost: Cost) => {
    if (cost.actualAmount === 0 || cost.predictedAmount === 0) return null;
    const deviation = (cost.actualAmount - cost.predictedAmount) / cost.predictedAmount;
    if (Math.abs(deviation) > 0.1) {
      return {
        isOver: deviation > 0,
        percentage: Math.abs(deviation) * 100
      };
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Todos os Custos</CardTitle>
          <Button size="sm">
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
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.map(cost => {
                const project = projects.find(p => p.id === cost.projectId);
                const deviation = getDeviationStatus(cost);
                return (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">{cost.description}</TableCell>
                    <TableCell>{project?.name}</TableCell>
                    <TableCell><Badge variant="outline">{cost.category}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(cost.predictedAmount)}</TableCell>
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
                       <Button variant="ghost" size="icon" onClick={() => handleAnalysis(cost.projectId)}>
                          <AlertCircle className="h-4 w-4 text-primary" />
                          <span className="sr-only">Analisar Desvio</span>
                       </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <DeviationAssistantDialog
        isOpen={isDialogOpen}
        setOpen={setDialogOpen}
        analysisResult={analysisResult}
      />
    </div>
  );
}

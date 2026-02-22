"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { AnalyzeDeviationOutput } from "@/ai/flows/deviation-analysis-assistant";
import { AlertTriangle } from "lucide-react";

interface DeviationAssistantDialogProps {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  analysisResult: AnalyzeDeviationOutput | null;
}

export default function DeviationAssistantDialog({ isOpen, setOpen, analysisResult }: DeviationAssistantDialogProps) {
  if (!analysisResult) return null;

  const { deviationAmount, deviationPercentage, aiExplanation } = analysisResult;
  const isOver = deviationAmount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-6 w-6" />
            Assistente de Análise de Desvio
          </DialogTitle>
          <DialogDescription>
            A IA detectou um desvio de custo significativo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
            <span className="font-medium">Valor do Desvio</span>
            <span className={`font-bold text-lg ${isOver ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(deviationAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
            <span className="font-medium">Percentual de Desvio</span>
            <Badge variant={isOver ? "destructive" : "secondary"} className="text-lg">
              {isOver ? '▲' : '▼'} {Math.abs(deviationPercentage).toFixed(2)}%
            </Badge>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Análise da IA:</h3>
            <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg border">
              {aiExplanation || "Nenhuma explicação gerada."}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

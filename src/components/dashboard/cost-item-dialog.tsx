'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser, useFirestore } from '@/firebase';
import type { CostItem, Project } from '@/lib/types';
import { CostItemForm, type CostItemFormValues } from './cost-item-form';
import { addCostItem, updateCostItem } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { CostItemFormData } from '@/lib/types';
import { addMonths } from 'date-fns';

interface CostItemDialogProps {
  costItem?: CostItem;
  projects: Project[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CostItemDialog({ costItem, projects, isOpen, onOpenChange }: CostItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSubmit = async (values: CostItemFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      if (costItem) {
        const costData: Record<string, any> = {
          ...values,
          transactionDate: values.transactionDate!.toISOString().split('T')[0],
          userId: user.uid,
        };
  
        // If projectId is undefined from the form, we want to remove it from the doc.
        // We signal this to the backend action with `null`.
        if (costData.projectId === undefined) {
          costData.projectId = null;
        }

        // Clean up any other fields that are strictly undefined, but keep our `projectId: null` signal
        Object.keys(costData).forEach(key => {
          if (costData[key] === undefined) {
            delete costData[key];
          }
        });
        
        await updateCostItem(firestore, user.uid, costItem.id, costData);
        toast({ title: 'Sucesso!', description: 'Conta a pagar atualizada.' });
      } else {
        if (values.isInstallment) {
          const { name, projectId, description, supplier, category, totalAmount, numberOfInstallments, firstInstallmentDate } = values;
  
          if (!totalAmount || !numberOfInstallments || !firstInstallmentDate) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Dados de parcelamento incompletos.' });
            setIsSubmitting(false);
            return;
          }
  
          const installmentValue = parseFloat((totalAmount / numberOfInstallments).toFixed(2));
          const remainder = parseFloat((totalAmount - (installmentValue * numberOfInstallments)).toFixed(2));
  
          for (let i = 0; i < numberOfInstallments; i++) {
            const costDataForInstallment: CostItemFormData = {
              name: `${name} - Parcela ${i + 1}/${numberOfInstallments}`,
              projectId,
              userId: user.uid,
              supplier,
              category,
              plannedAmount: i === numberOfInstallments - 1 ? installmentValue + remainder : installmentValue,
              actualAmount: 0,
              status: 'Pendente',
              transactionDate: addMonths(firstInstallmentDate, i).toISOString().split('T')[0],
              description: description || '',
              isInstallment: true,
              installmentNumber: i + 1,
              totalInstallments: numberOfInstallments,
            };
  
            const cleanData = Object.fromEntries(Object.entries(costDataForInstallment).filter(([, v]) => v !== undefined));
            if (!cleanData.projectId) delete cleanData.projectId;

            addCostItem(firestore, user.uid, cleanData as CostItemFormData);
          }
          toast({ title: 'Sucesso!', description: `${numberOfInstallments} parcelas criadas.` });
        } else {
          const costData: Record<string, any> = {
            ...values,
            transactionDate: values.transactionDate!.toISOString().split('T')[0],
            userId: user.uid,
            isInstallment: false
          };
          
          Object.keys(costData).forEach(key => costData[key] === undefined && delete costData[key]);
          if (!costData.projectId) delete costData.projectId;

          addCostItem(firestore, user.uid, costData as CostItemFormData);
          toast({ title: 'Sucesso!', description: 'Conta a pagar criada.' });
        }
      }
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a conta a pagar.' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          // Allow interaction with react-day-picker
          if (target.closest('.rdp')) {
            e.preventDefault();
          }
        }}
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{costItem ? 'Editar Conta a Pagar' : 'Adicionar Nova Conta a Pagar'}</DialogTitle>
          <DialogDescription>
            {costItem ? 'Edite os detalhes da sua conta a pagar.' : 'Preencha os detalhes para criar uma nova conta a pagar.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <CostItemForm
            costItem={costItem}
            projects={projects}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

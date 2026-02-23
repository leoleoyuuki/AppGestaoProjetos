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
    const costData = {
      ...values,
      projectId: values.projectId || undefined,
      transactionDate: values.transactionDate.toISOString().split('T')[0], // format to 'YYYY-MM-DD'
      userId: user.uid
    };

    try {
      if (costItem) {
        updateCostItem(firestore, user.uid, costItem.id, costData);
        toast({ title: 'Sucesso!', description: 'Custo atualizado.' });
      } else {
        addCostItem(firestore, user.uid, costData);
        toast({ title: 'Sucesso!', description: 'Custo criado.' });
      }
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o custo.' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{costItem ? 'Editar Custo' : 'Adicionar Novo Custo'}</DialogTitle>
          <DialogDescription>
            {costItem ? 'Edite os detalhes do seu custo.' : 'Preencha os detalhes para criar um novo custo.'}
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

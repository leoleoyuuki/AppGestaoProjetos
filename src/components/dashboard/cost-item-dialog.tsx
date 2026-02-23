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
      transactionDate: values.transactionDate.toISOString().split('T')[0], // format to 'YYYY-MM-DD'
      userId: user.uid
    };

    // Firestore throws an error if any field value is `undefined`.
    // If projectId is falsy (e.g., from selecting 'None'), delete it from the object
    // so Firestore either omits it (on create) or ignores it (on update).
    if (!costData.projectId) {
      delete (costData as Partial<typeof costData>).projectId;
    }


    try {
      if (costItem) {
        updateCostItem(firestore, user.uid, costItem.id, costData);
        toast({ title: 'Sucesso!', description: 'Conta a pagar atualizada.' });
      } else {
        addCostItem(firestore, user.uid, costData as CostItemFormData);
        toast({ title: 'Sucesso!', description: 'Conta a pagar criada.' });
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
      <DialogContent className="sm:max-w-2xl">
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

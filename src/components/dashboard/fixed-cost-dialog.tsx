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
import type { FixedCost, FixedCostFormData } from '@/lib/types';
import { FixedCostForm, type FixedCostFormValues } from './fixed-cost-form';
import { addFixedCost, updateFixedCost } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface FixedCostDialogProps {
  fixedCost?: FixedCost;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FixedCostDialog({ fixedCost, isOpen, onOpenChange }: FixedCostDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSubmit = async (values: FixedCostFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }

    setIsSubmitting(true);
    const costData: FixedCostFormData = {
      ...values,
      nextPaymentDate: values.nextPaymentDate.toISOString().split('T')[0], // format to 'YYYY-MM-DD'
      userId: user.uid
    };

    try {
      if (fixedCost) {
        updateFixedCost(firestore, user.uid, fixedCost.id, costData);
        toast({ title: 'Sucesso!', description: 'Custo fixo atualizado.' });
      } else {
        addFixedCost(firestore, user.uid, costData);
        toast({ title: 'Sucesso!', description: 'Custo fixo criado.' });
      }
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o custo fixo.' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fixedCost ? 'Editar Custo Fixo' : 'Adicionar Novo Custo Fixo'}</DialogTitle>
          <DialogDescription>
            {fixedCost ? 'Edite os detalhes do seu custo fixo.' : 'Preencha os detalhes para criar um novo custo fixo.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <FixedCostForm
            fixedCost={fixedCost}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

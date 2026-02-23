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
import type { RevenueItem, Project } from '@/lib/types';
import { RevenueItemForm, type RevenueItemFormValues } from './revenue-item-form';
import { addRevenueItem, updateRevenueItem } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface RevenueItemDialogProps {
  revenueItem?: RevenueItem;
  projects: Project[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RevenueItemDialog({ revenueItem, projects, isOpen, onOpenChange }: RevenueItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSubmit = async (values: RevenueItemFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }

    setIsSubmitting(true);
    const revenueData = {
      ...values,
      transactionDate: values.transactionDate.toISOString().split('T')[0], // format to 'YYYY-MM-DD'
      userId: user.uid,
      // Placeholder, as PaymentMethod is not fully implemented
      paymentMethodId: 'placeholder',
    };

    try {
      if (revenueItem) {
        updateRevenueItem(firestore, user.uid, revenueItem.projectId, revenueItem.id, revenueData);
        toast({ title: 'Sucesso!', description: 'Conta a receber atualizada.' });
      } else {
        addRevenueItem(firestore, user.uid, revenueData.projectId, revenueData);
        toast({ title: 'Sucesso!', description: 'Conta a receber criada.' });
      }
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a conta a receber.' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{revenueItem ? 'Editar Conta a Receber' : 'Adicionar Nova Conta a Receber'}</DialogTitle>
          <DialogDescription>
            {revenueItem ? 'Edite os detalhes da sua conta a receber.' : 'Preencha os detalhes para criar uma nova conta a receber.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RevenueItemForm
            revenueItem={revenueItem}
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

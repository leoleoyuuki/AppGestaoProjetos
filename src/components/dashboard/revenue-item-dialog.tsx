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
import type { RevenueItem, RevenueItemFormData, Project } from '@/lib/types';
import { RevenueItemForm, type RevenueItemFormValues } from './revenue-item-form';
import { addRevenueItem, updateRevenueItem } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { addMonths } from 'date-fns';

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

    try {
      if (revenueItem) {
        const revenueData = {
          ...(values as any),
          transactionDate: values.transactionDate!.toISOString().split('T')[0],
          userId: user.uid,
          paymentMethodId: 'placeholder',
        };
        await updateRevenueItem(firestore, user.uid, revenueItem.projectId, revenueItem.id, revenueData);
        toast({ title: 'Sucesso!', description: 'Conta a receber atualizada.' });
      } else {
        if (values.isInstallment) {
          const { name, projectId, description, totalAmount, numberOfInstallments, firstInstallmentDate } = values;

          if(!totalAmount || !numberOfInstallments || !firstInstallmentDate) {
              toast({ variant: 'destructive', title: 'Erro', description: 'Dados de parcelamento incompletos.' });
              setIsSubmitting(false);
              return;
          }

          const installmentValue = parseFloat((totalAmount / numberOfInstallments).toFixed(2));
          const remainder = parseFloat((totalAmount - (installmentValue * numberOfInstallments)).toFixed(2));

          for (let i = 0; i < numberOfInstallments; i++) {
              const revenueDataForInstallment: RevenueItemFormData = {
                  name: `${name} - Parcela ${i + 1}/${numberOfInstallments}`,
                  projectId,
                  userId: user.uid,
                  paymentMethodId: 'placeholder',
                  plannedAmount: i === numberOfInstallments - 1 ? installmentValue + remainder : installmentValue,
                  receivedAmount: 0,
                  transactionDate: addMonths(firstInstallmentDate, i).toISOString().split('T')[0],
                  description: description || '',
                  isInstallment: true,
                  installmentNumber: i + 1,
                  totalInstallments: numberOfInstallments,
              };
              addRevenueItem(firestore, user.uid, projectId, revenueDataForInstallment);
          }
          toast({ title: 'Sucesso!', description: `${numberOfInstallments} parcelas criadas.` });

        } else {
            const { name, projectId, description, plannedAmount, receivedAmount, transactionDate } = values;

            if(!plannedAmount || !transactionDate) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Dados de pagamento único incompletos.' });
                setIsSubmitting(false);
                return;
            }
            const revenueData: RevenueItemFormData = {
                name,
                projectId,
                userId: user.uid,
                paymentMethodId: 'placeholder',
                plannedAmount,
                receivedAmount: receivedAmount || 0,
                transactionDate: transactionDate.toISOString().split('T')[0],
                description: description || '',
                isInstallment: false,
            };
            addRevenueItem(firestore, user.uid, projectId, revenueData);
            toast({ title: 'Sucesso!', description: 'Conta a receber criada.' });
        }
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

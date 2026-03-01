'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore } from '@/firebase';
import { addRevenueItem } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Project, RevenueItemFormData } from '@/lib/types';
import { CircleDollarSign } from 'lucide-react';

interface QuickGainDialogProps {
  projects: Project[] | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Simplified schema for a quick gain
const quickGainFormSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
    projectId: z.string({ required_error: "Selecione um projeto." }),
    description: z.string().optional(),
    amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
});

type QuickGainFormValues = z.infer<typeof quickGainFormSchema>;

export function QuickGainDialog({ projects, isOpen, onOpenChange }: QuickGainDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<QuickGainFormValues>({
    resolver: zodResolver(quickGainFormSchema),
    defaultValues: {
      name: '',
      amount: 0,
      projectId: projects?.length === 1 ? projects[0].id : undefined,
      description: '',
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
      if (!isOpen) {
          form.reset({
            name: '',
            amount: 0,
            projectId: projects?.length === 1 ? projects[0].id : undefined,
            description: '',
          });
      }
  }, [isOpen, form, projects]);

  const handleSubmit = async (values: QuickGainFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
        const revenueData: RevenueItemFormData = {
            name: values.name,
            // Both planned and received are the same for a quick gain
            plannedAmount: values.amount,
            receivedAmount: values.amount,
            transactionDate: new Date().toISOString().split('T')[0], // Today's date
            description: values.description,
            isInstallment: false, // Not an installment
            userId: user.uid,
            projectId: values.projectId,
            paymentMethodId: 'quick_gain', // A special ID for this type of entry
        };

        addRevenueItem(firestore, user.uid, values.projectId, revenueData);
        toast({ title: 'Sucesso!', description: 'Ganho rápido adicionado com sucesso.' });
        onOpenChange(false);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o ganho.' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <CircleDollarSign />
                Adicionar Ganho Rápido
            </DialogTitle>
            <DialogDescription>
              Registre uma entrada de caixa inesperada ou não planejada.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome do Ganho</FormLabel>
                        <FormControl><Input placeholder="Ex: Venda de material extra" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Valor Recebido (R$)</FormLabel>
                        <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Projeto</FormLabel>
                        <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        >
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione um projeto" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {projects?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl><Textarea placeholder="Detalhes adicionais..." {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Adicionar Ganho'}
                    </Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addRevenueItem, receiveRevenueItem } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Project, RevenueItem, RevenueItemFormData } from '@/lib/types';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import { CircleDollarSign } from 'lucide-react';
import { Switch } from '../ui/switch';
import { formatCurrency } from '@/lib/utils';

interface QuickGainDialogProps {
  projects: Project[] | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickGainFormSchema = z.object({
    isSettlingExisting: z.boolean().default(false),
    // Fields for settling existing receivable
    selectedRevenueItemId: z.string().optional(),
    // Fields for new gain
    name: z.string().optional(),
    projectId: z.string().optional(),
    description: z.string().optional(),
    // Common field
    amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
}).superRefine((data, ctx) => {
    if (data.isSettlingExisting) {
        if (!data.selectedRevenueItemId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Selecione uma conta a receber.",
                path: ["selectedRevenueItemId"],
            });
        }
    } else {
        if (!data.name || data.name.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O nome deve ter pelo menos 2 caracteres.", path: ["name"] });
        }
         if (!data.projectId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "É necessário selecionar um projeto.", path: ["projectId"] });
        }
    }
});


type QuickGainFormValues = z.infer<typeof quickGainFormSchema>;

export function QuickGainDialog({ projects, isOpen, onOpenChange }: QuickGainDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const pendingRevenuesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // This is a collection group query, which requires an index.
    // It is also insecure if not properly constrained.
    return query(
        collectionGroup(firestore, 'revenueItems'),
        where('userId', '==', user.uid),
        where('receivedAmount', '==', 0)
    );
  }, [firestore, user]);
  const { data: pendingRevenues, isLoading: pendingRevenuesLoading } = useCollection<RevenueItem>(pendingRevenuesQuery);

  const form = useForm<QuickGainFormValues>({
    resolver: zodResolver(quickGainFormSchema),
    defaultValues: {
      isSettlingExisting: false,
      name: '',
      amount: 0,
      projectId: projects?.length === 1 ? projects[0].id : undefined,
      description: '',
      selectedRevenueItemId: undefined,
    },
  });

  const isSettlingExisting = form.watch('isSettlingExisting');

  const filteredPendingRevenues = useMemo(() => {
    if (!pendingRevenues) return [];
    if (!projectFilter) return []; // Don't show anything until a project is selected.
    return pendingRevenues.filter(rev => rev.projectId === projectFilter);
  }, [pendingRevenues, projectFilter]);

  // When the project filter changes, clear the selected item and amount.
  useEffect(() => {
    form.setValue('selectedRevenueItemId', undefined);
    form.setValue('amount', 0);
  }, [projectFilter, form]);

  useEffect(() => {
      if (!isOpen) {
          form.reset({
            isSettlingExisting: false,
            name: '',
            amount: 0,
            projectId: projects?.length === 1 ? projects[0].id : undefined,
            description: '',
            selectedRevenueItemId: undefined,
          });
          setProjectFilter('');
      }
  }, [isOpen, form, projects]);

  const handleSubmit = async (values: QuickGainFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
        if (values.isSettlingExisting) {
            if (!values.selectedRevenueItemId || !pendingRevenues) {
                 toast({ variant: 'destructive', title: 'Erro', description: 'Conta a receber não selecionada.' });
                 setIsSubmitting(false);
                 return;
            }
            const revenueToSettle = pendingRevenues.find(c => c.id === values.selectedRevenueItemId);
            if (!revenueToSettle) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Conta selecionada não encontrada.' });
                setIsSubmitting(false);
                return;
            }
            
            await receiveRevenueItem(firestore, user.uid, revenueToSettle, values.amount);
            toast({ title: 'Sucesso!', description: 'Conta recebida com sucesso.' });

        } else {
            if (!values.projectId) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Um projeto deve ser selecionado para um novo ganho.' });
                setIsSubmitting(false);
                return;
            }
             const revenueData: RevenueItemFormData = {
                name: values.name!,
                plannedAmount: values.amount,
                receivedAmount: values.amount,
                transactionDate: new Date().toISOString().split('T')[0],
                description: values.description,
                isInstallment: false,
                userId: user.uid,
                projectId: values.projectId,
                paymentMethodId: 'quick_gain',
            };

            addRevenueItem(firestore, user.uid, values.projectId, revenueData);
            toast({ title: 'Sucesso!', description: 'Ganho rápido adicionado.' });
        }
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
              Para entradas de dinheiro do dia a dia ou para quitar uma conta já prevista.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="isSettlingExisting"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Quitar conta existente?</FormLabel>
                                <FormDescription>Marque para registrar o recebimento de uma conta pendente.</FormDescription>
                                <FormMessage />
                            </div>
                             <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {isSettlingExisting ? (
                    <>
                        <FormItem>
                            <FormLabel>Filtrar por Projeto</FormLabel>
                            <Select
                                onValueChange={(value) => setProjectFilter(value)}
                                value={projectFilter}
                            >
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um projeto para ver as contas" />
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
                        </FormItem>

                        <FormField
                            control={form.control}
                            name="selectedRevenueItemId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Conta a Receber</FormLabel>
                                    <Select 
                                      onValueChange={value => {
                                        field.onChange(value);
                                        const selectedRevenue = filteredPendingRevenues?.find(c => c.id === value);
                                        if (selectedRevenue) {
                                            form.setValue('amount', selectedRevenue.plannedAmount);
                                        }
                                      }} 
                                      defaultValue={field.value}
                                      disabled={!projectFilter || pendingRevenuesLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={
                                                    !projectFilter ? "Primeiro selecione um projeto" :
                                                    pendingRevenuesLoading ? "Carregando..." :
                                                    (filteredPendingRevenues.length === 0) ? "Nenhuma conta pendente neste projeto" :
                                                    "Selecione uma conta a receber"
                                                } />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {filteredPendingRevenues && filteredPendingRevenues.length > 0 ? (
                                                filteredPendingRevenues.map((revenue) => (
                                                    <SelectItem key={revenue.id} value={revenue.id}>
                                                        {revenue.name} ({formatCurrency(revenue.plannedAmount)}) - {new Date(revenue.transactionDate + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>Não há nenhuma conta a receber prevista nesse projeto.</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor a Receber (R$)</FormLabel>
                                <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </>
                ) : (
                     <>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Ganho</FormLabel>
                                <FormControl><Input placeholder="Ex: Adiantamento Cliente Y" {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor (R$)</FormLabel>
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
                    </>
                )}
            <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Ganho'}
                </Button>
            </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  );
}

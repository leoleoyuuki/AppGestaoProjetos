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
import { addCostItem, payCostItem } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Project, CostCategory, CostItemFormData, CostItem } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { Zap, PlusCircle } from 'lucide-react';
import { AddCategoryDialog } from './add-category-dialog';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { formatCurrency } from '@/lib/utils';

interface QuickExpenseDialogProps {
  projects: Project[] | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickExpenseFormSchema = z.object({
    isPayingExisting: z.boolean().default(false),
    // Fields for paying existing bill
    selectedCostItemId: z.string().optional(),
    // Fields for new expense
    name: z.string().optional(),
    category: z.string().optional(),
    projectId: z.string().optional(),
    description: z.string().optional(),
    // Common field
    amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
}).superRefine((data, ctx) => {
    if (data.isPayingExisting) {
        if (!data.selectedCostItemId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Selecione uma conta a pagar.",
                path: ["selectedCostItemId"],
            });
        }
    } else {
        if (!data.name || data.name.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O nome deve ter pelo menos 2 caracteres.", path: ["name"] });
        }
        if (!data.category) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A categoria é obrigatória.", path: ["category"] });
        }
    }
});


type QuickExpenseFormValues = z.infer<typeof quickExpenseFormSchema>;

export function QuickExpenseDialog({ projects, isOpen, onOpenChange }: QuickExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/costCategories`));
  }, [firestore, user]);
  const { data: costCategories, isLoading: categoriesLoading } = useCollection<CostCategory>(categoriesQuery);
  
  // Fetch pending costs
  const pendingCostsQuery = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return query(
          collection(firestore, `users/${user.uid}/costItems`),
          where('status', '==', 'Pendente')
      );
  }, [firestore, user]);
  const { data: pendingCosts, isLoading: pendingCostsLoading } = useCollection<CostItem>(pendingCostsQuery);


  const form = useForm<QuickExpenseFormValues>({
    resolver: zodResolver(quickExpenseFormSchema),
    defaultValues: {
      isPayingExisting: false,
      name: '',
      amount: 0,
      projectId: '--none--',
      category: '',
      description: '',
      selectedCostItemId: undefined,
    },
  });
  
  const isPayingExisting = form.watch('isPayingExisting');

  useEffect(() => {
      if (!isOpen) {
          form.reset({
            isPayingExisting: false,
            name: '',
            amount: 0,
            projectId: '--none--',
            category: '',
            description: '',
            selectedCostItemId: undefined,
          });
      }
  }, [isOpen, form]);


  const handleSubmit = async (values: QuickExpenseFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
        if (values.isPayingExisting) {
            if (!values.selectedCostItemId || !pendingCosts) {
                 toast({ variant: 'destructive', title: 'Erro', description: 'Conta pendente não selecionada.' });
                 setIsSubmitting(false);
                 return;
            }
            const costToPay = pendingCosts.find(c => c.id === values.selectedCostItemId);
            if (!costToPay) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Conta selecionada não encontrada.' });
                setIsSubmitting(false);
                return;
            }
            
            await payCostItem(firestore, user.uid, costToPay, values.amount);
            toast({ title: 'Sucesso!', description: 'Conta paga com sucesso.' });

        } else {
             const costData: CostItemFormData = {
                name: values.name!,
                plannedAmount: values.amount,
                actualAmount: values.amount,
                category: values.category!,
                status: 'Pago',
                transactionDate: new Date().toISOString().split('T')[0],
                description: values.description,
                isInstallment: false,
                isRecurring: false,
                userId: user.uid,
            };

            if (values.projectId && values.projectId !== '--none--') {
                costData.projectId = values.projectId;
            }

            addCostItem(firestore, user.uid, costData);
            toast({ title: 'Sucesso!', description: 'Despesa rápida adicionada.' });
        }
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a despesa.' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Zap />
                Adicionar Despesa Rápida
            </DialogTitle>
            <DialogDescription>
              Para gastos do dia a dia ou para quitar uma conta já prevista.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="isPayingExisting"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Pagar conta existente?</FormLabel>
                                <FormDescription>
                                    Marque para quitar uma conta pendente.
                                </FormDescription>
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

                {isPayingExisting ? (
                    <>
                        <FormField
                            control={form.control}
                            name="selectedCostItemId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Conta a Pagar</FormLabel>
                                    <Select 
                                      onValueChange={value => {
                                        field.onChange(value);
                                        // Auto-fill amount when an item is selected
                                        const selectedCost = pendingCosts?.find(c => c.id === value);
                                        if (selectedCost) {
                                            form.setValue('amount', selectedCost.plannedAmount);
                                        }
                                      }} 
                                      defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger disabled={pendingCostsLoading}>
                                                <SelectValue placeholder={pendingCostsLoading ? "Carregando..." : "Selecione uma conta pendente"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {pendingCosts && pendingCosts.length > 0 ? (
                                                pendingCosts.map((cost) => (
                                                    <SelectItem key={cost.id} value={cost.id}>
                                                        {cost.name} ({formatCurrency(cost.plannedAmount)})
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>Nenhuma conta pendente</SelectItem>
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
                                <FormLabel>Valor a Pagar (R$)</FormLabel>
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
                                <FormLabel>Nome da Despesa</FormLabel>
                                <FormControl><Input placeholder="Ex: Gasolina" {...field} /></FormControl>
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
                            name="category"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={categoriesLoading}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione uma categoria"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {costCategories?.map((c) => (
                                    <SelectItem key={c.id} value={c.name}>
                                        {c.name}
                                    </SelectItem>
                                    ))}
                                    <Separator className="my-1" />
                                    <div className="p-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={(e) => { e.preventDefault(); setCategoryDialogOpen(true)}}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Adicionar categoria
                                    </Button>
                                    </div>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="projectId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Projeto (Opcional)</FormLabel>
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
                                    <SelectItem value="--none--">Nenhum (Custo da Empresa)</SelectItem>
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
                                <FormControl><Textarea placeholder="Detalhes adicionais..." {...field} /></FormControl>
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
                {isSubmitting ? 'Salvando...' : 'Salvar Despesa'}
                </Button>
            </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AddCategoryDialog isOpen={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
    </>
  );
}

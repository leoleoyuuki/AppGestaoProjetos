'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FixedCost, CostCategory } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Separator } from '../ui/separator';
import { AddCategoryDialog } from './add-category-dialog';

const fixedCostFormSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  frequency: z.string().min(1, 'A frequência é obrigatória.'),
  nextPaymentDate: z.date({ required_error: 'A data do próximo pagamento é obrigatória.' }),
  description: z.string().optional(),
});

export type FixedCostFormValues = z.infer<typeof fixedCostFormSchema>;

interface FixedCostFormProps {
  fixedCost?: FixedCost;
  onSubmit: (values: FixedCostFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const parseDateString = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  if (!dateString.includes('-')) return new Date(dateString); 
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export function FixedCostForm({ fixedCost, onSubmit, onCancel, isSubmitting }: FixedCostFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [isCalendarOpen, setCalendarOpen] = useState(false);

  const categoriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/costCategories`));
  }, [firestore, user]);
  const { data: costCategories, isLoading: categoriesLoading } = useCollection<CostCategory>(categoriesQuery);
  
  const form = useForm<FixedCostFormValues>({
    resolver: zodResolver(fixedCostFormSchema),
    defaultValues: fixedCost
    ? { ...fixedCost, nextPaymentDate: parseDateString(fixedCost.nextPaymentDate) }
    : {
        name: '',
        category: '',
        amount: 0,
        frequency: 'monthly',
        description: '',
        nextPaymentDate: new Date(0), 
      },
  });

  useEffect(() => {
    if (!fixedCost) {
      form.setValue('nextPaymentDate', new Date());
    }
  }, [fixedCost, form]);


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Custo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Aluguel do Escritório" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          onClick={() => setCategoryDialogOpen(true)}
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Mensal</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          <FormField
            control={form.control}
            name="nextPaymentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Próximo Pagamento</FormLabel>
                <Dialog open={isCalendarOpen} onOpenChange={setCalendarOpen}>
                  <DialogTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value && field.value.getTime() !== 0 ? format(field.value, 'PPP', {locale: ptBR}) : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </DialogTrigger>
                  <DialogContent className="w-auto p-0" aria-describedby={undefined}>
                    <DialogHeader className="p-4 items-center">
                      <DialogTitle>Selecionar Próximo Pagamento</DialogTitle>
                    </DialogHeader>
                    <Separator />
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if(!date) return;
                        field.onChange(date);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                    <Separator />
                    <DialogFooter className="p-2">
                      <Button className="w-full" variant="ghost" onClick={() => setCalendarOpen(false)}>Cancelar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (Observação)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalhes adicionais sobre o custo..." {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Custo Fixo'}
            </Button>
          </div>
        </form>
      </Form>
      <AddCategoryDialog isOpen={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
    </>
  );
}

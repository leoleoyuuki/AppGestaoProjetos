'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { CostItem, Project, CostCategory } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Separator } from '../ui/separator';
import { AddCategoryDialog } from './add-category-dialog';


const costItemFormSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  supplier: z.string().optional(),
  projectId: z.string().optional(),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  plannedAmount: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  actualAmount: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  transactionDate: z.date({ required_error: 'A data é obrigatória.' }),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

export type CostItemFormValues = z.infer<typeof costItemFormSchema>;

interface CostItemFormProps {
  costItem?: CostItem;
  projects: Project[];
  onSubmit: (values: CostItemFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const parseDateString = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  // Handle Firestore Timestamps that might be converted to strings
  if (!dateString.includes('-')) return new Date(dateString); 
  // Handle 'YYYY-MM-DD' string, parsing in UTC to avoid timezone shifts
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export function CostItemForm({ costItem, projects, onSubmit, onCancel, isSubmitting }: CostItemFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [isCalendarOpen, setCalendarOpen] = useState(false);

  const categoriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/costCategories`));
  }, [firestore, user]);
  const { data: costCategories, isLoading: categoriesLoading } = useCollection<CostCategory>(categoriesQuery);
  
  const form = useForm<CostItemFormValues>({
    resolver: zodResolver(costItemFormSchema),
    defaultValues: costItem
    ? { ...costItem, transactionDate: parseDateString(costItem.transactionDate) }
    : {
        name: '',
        supplier: '',
        projectId: projects.length === 1 ? projects[0].id : undefined,
        category: '',
        plannedAmount: 0,
        actualAmount: 0,
        description: '',
        isRecurring: false,
        // Use a static placeholder for SSR, will be updated in useEffect
        transactionDate: new Date(0), 
      },
  });

  useEffect(() => {
    // This runs only on the client, after hydration
    if (!costItem) {
      // For new items, set the date to today
      form.setValue('transactionDate', new Date());
    }
  }, [costItem, form]);


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Custo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Licença de Software" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Microsoft" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projeto</FormLabel>
                <Select
                  key={field.value}
                  onValueChange={(value) => field.onChange(value === '--none--' ? undefined : value)}
                  defaultValue={field.value || '--none--'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="--none--">Nenhum (Custo da Empresa)</SelectItem>
                    {projects.map((p) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="plannedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Planejado</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="actualAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Real</FormLabel>
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
            name="transactionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da Transação</FormLabel>
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
                        {field.value && field.value.getTime() !== 0 ? format(field.value, 'PPP') : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </DialogTrigger>
                  <DialogContent className="w-auto p-0">
                    <DialogHeader>
                      <DialogTitle className="sr-only">Escolha uma data</DialogTitle>
                    </DialogHeader>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
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
          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Custo Recorrente</FormLabel>
                  <FormDescription>
                    Marque se este custo se repete.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Conta'}
            </Button>
          </div>
        </form>
      </Form>
      <AddCategoryDialog isOpen={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
    </>
  );
}

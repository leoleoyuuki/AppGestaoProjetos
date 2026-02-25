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
import type { CostItem, Project, CostCategory, CostItemStatus } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Separator } from '../ui/separator';
import { AddCategoryDialog } from './add-category-dialog';


const costStatus: CostItemStatus[] = ['Pendente', 'Pago'];

const costItemFormSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  supplier: z.string().optional(),
  projectId: z.string().optional(),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  status: z.enum(costStatus, { required_error: 'O status é obrigatório.' }),
  plannedAmount: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  actualAmount: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  transactionDate: z.date({ required_error: 'A data é obrigatória.' }),
  description: z.string().optional(),
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
        status: 'Pendente',
        plannedAmount: 0,
        actualAmount: 0,
        description: '',
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
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {costStatus.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
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
                <FormLabel>Data de Vencimento</FormLabel>
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
                      <DialogTitle>Selecionar Data de Vencimento</DialogTitle>
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
              {isSubmitting ? 'Salvando...' : 'Salvar Conta'}
            </Button>
          </div>
        </form>
      </Form>
      <AddCategoryDialog isOpen={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
    </>
  );
}

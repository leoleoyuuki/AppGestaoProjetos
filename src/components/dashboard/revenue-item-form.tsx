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
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { RevenueItem, Project } from '@/lib/types';
import { useState, useEffect } from 'react';

const revenueItemFormSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  projectId: z.string({ required_error: 'Selecione um projeto.' }),
  plannedAmount: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  receivedAmount: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  transactionDate: z.date({ required_error: 'A data é obrigatória.' }),
  description: z.string().optional(),
  isInstallment: z.boolean().default(false),
});

export type RevenueItemFormValues = z.infer<typeof revenueItemFormSchema>;

interface RevenueItemFormProps {
  revenueItem?: RevenueItem;
  projects: Project[];
  onSubmit: (values: RevenueItemFormValues) => void;
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

export function RevenueItemForm({ revenueItem, projects, onSubmit, onCancel, isSubmitting }: RevenueItemFormProps) {
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  
  const form = useForm<RevenueItemFormValues>({
    resolver: zodResolver(revenueItemFormSchema),
    defaultValues: revenueItem
    ? { ...revenueItem, transactionDate: parseDateString(revenueItem.transactionDate) }
    : {
        name: '',
        projectId: projects.length > 0 ? projects[0].id : undefined,
        plannedAmount: 0,
        receivedAmount: 0,
        description: '',
        isInstallment: false,
        // Use a static placeholder for SSR, will be updated in useEffect
        transactionDate: new Date(0),
      },
  });

  useEffect(() => {
    // This runs only on the client, after hydration
    if (!revenueItem) {
      // For new items, set the date to today
      form.setValue('transactionDate', new Date());
    }
  }, [revenueItem, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Conta (Parcela)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Pagamento da Fase 1" {...field} />
              </FormControl>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
            name="receivedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Recebido</FormLabel>
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
                      if(!date) return;
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
                <Textarea placeholder="Detalhes adicionais sobre a receita..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isInstallment"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>É uma parcela?</FormLabel>
                <FormDescription>
                  Marque se esta receita é parte de um pagamento parcelado.
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
  );
}

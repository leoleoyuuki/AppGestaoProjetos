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
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Info } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RevenueItem, Project } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Separator } from '../ui/separator';

const revenueItemFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  projectId: z.string({ required_error: "Selecione um projeto." }),
  description: z.string().optional(),
  isInstallment: z.boolean().default(false),
  // Single payment fields
  plannedAmount: z.coerce.number().optional(),
  receivedAmount: z.coerce.number().min(0, "O valor recebido deve ser positivo.").optional(),
  transactionDate: z.date().optional(),
  // Installment fields
  totalAmount: z.coerce.number().optional(),
  numberOfInstallments: z.coerce.number().int().optional(),
  firstInstallmentDate: z.date().optional(),
})
.superRefine((data, ctx) => {
    if (data.isInstallment) {
        if (!data.totalAmount || data.totalAmount <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O valor total deve ser maior que zero.", path: ["totalAmount"] });
        }
        if (!data.numberOfInstallments || data.numberOfInstallments < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Deve haver pelo menos 2 parcelas.", path: ["numberOfInstallments"] });
        }
        if (!data.firstInstallmentDate) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A data da primeira parcela é obrigatória.", path: ["firstInstallmentDate"] });
        }
    } else {
        if (!data.plannedAmount || data.plannedAmount <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O valor planejado deve ser maior que zero.", path: ["plannedAmount"] });
        }
        if (!data.transactionDate) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A data é obrigatória.", path: ["transactionDate"] });
        }
    }
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
  if (!dateString.includes('-')) return new Date(dateString); 
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export function RevenueItemForm({ revenueItem, projects, onSubmit, onCancel, isSubmitting }: RevenueItemFormProps) {
  const [isTransactionCalendarOpen, setTransactionCalendarOpen] = useState(false);
  const [isFirstInstallmentCalendarOpen, setFirstInstallmentCalendarOpen] = useState(false);
  const isEditing = !!revenueItem;
  
  const form = useForm<RevenueItemFormValues>({
    resolver: zodResolver(revenueItemFormSchema),
    defaultValues: revenueItem
    ? { ...revenueItem, transactionDate: parseDateString(revenueItem.transactionDate), isInstallment: revenueItem.isInstallment || false }
    : {
        isInstallment: false,
        name: '',
        projectId: projects.length > 0 ? projects[0].id : undefined,
        plannedAmount: 0,
        receivedAmount: 0,
        description: '',
        totalAmount: 0,
        numberOfInstallments: 2,
        transactionDate: new Date(0),
        firstInstallmentDate: new Date(0),
      },
  });

  const isInstallment = form.watch('isInstallment');
  const totalAmount = form.watch('totalAmount');
  const numberOfInstallments = form.watch('numberOfInstallments');

  const installmentValue = (totalAmount && numberOfInstallments) ? totalAmount / numberOfInstallments : 0;

  useEffect(() => {
    if (!isEditing) {
      const today = new Date();
      form.setValue('transactionDate', today);
      form.setValue('firstInstallmentDate', today);
    }
  }, [isEditing, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <FormField
          control={form.control}
          name="isInstallment"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                  disabled={isEditing}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>É uma parcela?</FormLabel>
                <FormDescription>
                  {isEditing ? 'Não é possível alterar o tipo de lançamento.' : 'Marque se esta receita é parte de um pagamento parcelado.'}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isInstallment ? "Nome da Venda" : "Nome da Conta"}</FormLabel>
              <FormControl>
                <Input placeholder={isInstallment ? "Ex: Venda de Sistema Solar" : "Ex: Pagamento da Fase 1"} {...field} />
              </FormControl>
               {isInstallment && <FormDescription>Este será o nome base para identificar as parcelas (Ex: Venda... - Parcela 1/12).</FormDescription>}
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

        {isInstallment ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total da Venda</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="numberOfInstallments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormItem>
                <FormLabel>Valor por Parcela (Aprox.)</FormLabel>
                <FormControl><Input type="text" value={formatCurrency(installmentValue)} readOnly disabled /></FormControl>
                <FormDescription className="flex items-center gap-1 text-xs">
                  <Info className="h-3 w-3" />
                  <span>O valor final da última parcela pode ter um ajuste de centavos.</span>
                </FormDescription>
            </FormItem>
            <FormField
              control={form.control}
              name="firstInstallmentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Primeira Parcela</FormLabel>
                  <Dialog open={isFirstInstallmentCalendarOpen} onOpenChange={setFirstInstallmentCalendarOpen}>
                    <DialogTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value && field.value.getTime() !== 0 ? format(field.value, 'PPP', {locale: ptBR}) : <span>Escolha uma data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </DialogTrigger>
                    <DialogContent className="w-auto p-0">
                      <DialogHeader className="p-4 items-center">
                        <DialogTitle>Data da Primeira Parcela</DialogTitle>
                      </DialogHeader>
                      <Separator />
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(d) => { if(d) field.onChange(d); setFirstInstallmentCalendarOpen(false); }}
                        initialFocus
                      />
                      <Separator />
                      <DialogFooter className="p-2">
                        <Button className="w-full" variant="ghost" onClick={() => setFirstInstallmentCalendarOpen(false)}>Cancelar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plannedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Planejado</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
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
                    <FormControl><Input type="number" {...field} disabled={!isEditing} /></FormControl>
                    <FormDescription>Este campo só é editável para contas existentes.</FormDescription>
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
                  <Dialog open={isTransactionCalendarOpen} onOpenChange={setTransactionCalendarOpen}>
                    <DialogTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value && field.value.getTime() !== 0 ? format(field.value, 'PPP', {locale: ptBR}) : <span>Escolha uma data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </DialogTrigger>
                    <DialogContent className="w-auto p-0">
                      <DialogHeader className="p-4 items-center">
                          <DialogTitle>Data de Vencimento</DialogTitle>
                      </DialogHeader>
                      <Separator />
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(d) => { if(d) field.onChange(d); setTransactionCalendarOpen(false);}}
                        initialFocus
                      />
                      <Separator />
                      <DialogFooter className="p-2">
                          <Button className="w-full" variant="ghost" onClick={() => setTransactionCalendarOpen(false)}>Cancelar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

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

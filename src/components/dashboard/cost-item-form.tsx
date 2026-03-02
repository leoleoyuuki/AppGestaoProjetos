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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Info } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CostItem, Project, CostCategory, CostItemStatus } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Separator } from '../ui/separator';
import { AddCategoryDialog } from './add-category-dialog';
import { Checkbox } from '../ui/checkbox';


const costStatus: CostItemStatus[] = ['Pendente', 'Pago'];

const costItemFormSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  supplier: z.string().optional(),
  projectId: z.string().optional(),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  status: z.enum(costStatus, { required_error: 'O status é obrigatório.' }),
  description: z.string().optional(),
  isInstallment: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  frequency: z.string().optional(),
  // Single payment fields
  plannedAmount: z.coerce.number().optional(),
  actualAmount: z.coerce.number().min(0, 'O valor deve ser positivo.').optional(),
  transactionDate: z.date().optional(),
  // Installment fields
  totalAmount: z.coerce.number().optional(),
  numberOfInstallments: z.coerce.number().int().optional(),
  firstInstallmentDate: z.date().optional(),
})
.superRefine((data, ctx) => {
    if (data.isInstallment && data.isRecurring) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Um custo não pode ser parcelado e recorrente ao mesmo tempo.",
            path: ["isRecurring"],
        });
    }
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
    } else { // Applies to both single and recurring payments
        if (!data.plannedAmount || data.plannedAmount <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O valor planejado deve ser maior que zero.", path: ["plannedAmount"] });
        }
        if (!data.transactionDate) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A data é obrigatória.", path: ["transactionDate"] });
        }
    }
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
  const [isTransactionCalendarOpen, setTransactionCalendarOpen] = useState(false);
  const [isFirstInstallmentCalendarOpen, setFirstInstallmentCalendarOpen] = useState(false);
  const isEditing = !!costItem;

  const categoriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/costCategories`));
  }, [firestore, user]);
  const { data: costCategories, isLoading: categoriesLoading } = useCollection<CostCategory>(categoriesQuery);
  
  const form = useForm<CostItemFormValues>({
    resolver: zodResolver(costItemFormSchema),
    defaultValues: costItem
    ? { 
        ...costItem, 
        transactionDate: parseDateString(costItem.transactionDate), 
        isInstallment: costItem.isInstallment || false,
        isRecurring: costItem.isRecurring || false,
        frequency: costItem.frequency || 'monthly'
      }
    : {
        isInstallment: false,
        isRecurring: false,
        name: '',
        supplier: '',
        projectId: projects.length === 1 ? projects[0].id : undefined,
        category: '',
        status: 'Pendente',
        plannedAmount: 0,
        actualAmount: 0,
        description: '',
        totalAmount: 0,
        numberOfInstallments: 2,
        transactionDate: new Date(0),
        firstInstallmentDate: new Date(0),
        frequency: 'monthly',
      },
  });

  const isInstallment = form.watch('isInstallment');
  const isRecurring = form.watch('isRecurring');
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
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {!isEditing && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="isInstallment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 h-full">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) form.setValue('isRecurring', false);
                            }}
                            disabled={isEditing}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>É uma compra parcelada?</FormLabel>
                          <FormDescription>
                            Marque se este custo será pago em parcelas.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 h-full">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) form.setValue('isInstallment', false);
                            }}
                            disabled={isEditing}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>É um custo recorrente?</FormLabel>
                          <FormDescription>
                            Marque para custos que se repetem (ex: aluguel).
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
             </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isInstallment ? "Nome da Compra" : "Nome do Custo"}</FormLabel>
                  <FormControl>
                    <Input placeholder={isInstallment ? "Ex: Compra de Ferramentas" : "Ex: Licença de Software"} {...field} />
                  </FormControl>
                   {isInstallment && <FormDescription>Este será o nome base para identificar as parcelas.</FormDescription>}
                   {isRecurring && <FormDescription>Ex: Aluguel Escritório, Assinatura Adobe</FormDescription>}
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
                    <Input placeholder="Ex: Loja do Mecânico" {...field} value={field.value || ''} />
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
                        onClick={(e) => {
                          e.preventDefault();
                          setCategoryDialogOpen(true);
                        }}
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

          {isInstallment ? (
             <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total da Compra</FormLabel>
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
                    <Popover open={isFirstInstallmentCalendarOpen} onOpenChange={setFirstInstallmentCalendarOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value && field.value.getTime() !== 0 ? format(field.value, 'PPP', {locale: ptBR}) : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setFirstInstallmentCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : (
            <>
              {isRecurring && (
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
                                    <SelectItem value="annually">Anual</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              )}
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
                      <FormLabel>{isRecurring ? "Valor Recorrente" : "Valor Planejado"}</FormLabel>
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
                      <FormLabel>Valor Real (Pago)</FormLabel>
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
                    <FormLabel>{isRecurring ? "Data do Próximo Vencimento" : "Data de Vencimento"}</FormLabel>
                    <Popover open={isTransactionCalendarOpen} onOpenChange={setTransactionCalendarOpen} modal={true}>
                      <PopoverTrigger asChild>
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
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setTransactionCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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

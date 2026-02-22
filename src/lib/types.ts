import type { LucideIcon } from 'lucide-react';

export type ProjectStatus = 'Em andamento' | 'Concluído' | 'Cancelado';
export type PaymentMethod = 'Dinheiro' | 'Cartão de Crédito' | 'Transferência Bancária';
export type CostCategory = 'Mão de obra' | 'Materiais' | 'Marketing' | 'Software' | 'Outros';

export type Cost = {
  id: string;
  projectId: string;
  category: CostCategory;
  description: string;
  predictedAmount: number;
  actualAmount: number;
  date: string;
  isRecurring: boolean;
};

export type Revenue = {
  id: string;
  projectId: string;
  description: string;
  predictedAmount: number;
  actualAmount: number;
  date: string;
  paymentMethod: PaymentMethod;
  installments: number;
};

export type Project = {
  id: string;
  name: string;
  client?: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
};

export type Transaction = {
  id: string;
  type: 'Receita' | 'Custo';
  description: string;
  amount: number;
  date: string;
  category: CostCategory | 'Receita';
  project: string;
  status: 'Pendente' | 'Recebido' | 'Pago';
};

import type { LucideIcon } from 'lucide-react';
import { type DocumentData, type Timestamp } from 'firebase/firestore';


export type ProjectStatus = 'Em andamento' | 'Concluído' | 'Cancelado';
export type PaymentMethod = 'Dinheiro' | 'Cartão de Crédito' | 'Transferência Bancária';
export type CostCategory = 'Mão de obra' | 'Materiais' | 'Marketing' | 'Software' | 'Outros';


// From backend.json entities
export interface UserProfile extends DocumentData {
    id: string;
    email: string;
    name: string;
    createdAt: Timestamp | string;
    updatedAt: Timestamp | string;
}

export interface Project extends DocumentData {
    id: string;
    userId: string;
    name: string;
    client?: string;
    startDate: string;
    endDate: string;
    status: ProjectStatus;
    plannedTotalCost: number;
    plannedTotalRevenue: number;
    actualTotalCost: number;
    actualTotalRevenue: number;
    description?: string;
    createdAt: Timestamp | string;
    updatedAt: Timestamp | string;
}

export interface CostItem extends DocumentData {
    id: string;
    projectId: string;
    userId: string;
    name: string;
    category: CostCategory;
    plannedAmount: number;
    actualAmount: number;
    transactionDate: string;
    description?: string;
    isRecurring: boolean;
    recurrenceFrequency?: string;
    deviationAnalysisNote?: string;
    createdAt: Timestamp | string;
    updatedAt: Timestamp | string;
}

export interface RevenueItem extends DocumentData {
    id: string;
    projectId: string;
    userId: string;
    paymentMethodId: string;
    name: string;
    plannedAmount: number;
    receivedAmount: number;
    transactionDate: string;
    description?: string;
    isInstallment: boolean;
    installmentNumber?: number;
    totalInstallments?: number;
    createdAt: Timestamp | string;
    updatedAt: Timestamp | string;
}

export interface FixedCost extends DocumentData {
    id: string;
    userId: string;
    name: string;
    category: string;
    amount: number;
    frequency: string;
    nextPaymentDate: string;
    description?: string;
    createdAt: Timestamp | string;
    updatedAt: Timestamp | string;
}

// Transaction is a derived type for the cashflow tab, not a direct Firestore entity.
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

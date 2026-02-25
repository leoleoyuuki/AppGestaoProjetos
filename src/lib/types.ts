'use client';

import type { LucideIcon } from 'lucide-react';
import { type DocumentData, type Timestamp } from 'firebase/firestore';


export type ProjectStatus = 'Pendente' | 'Em andamento' | 'Instalado' | 'Concluído' | 'Cancelado';
export type PaymentMethod = 'Dinheiro' | 'Cartão de Crédito' | 'Transferência Bancária';
export type CostItemStatus = 'Pendente' | 'Pago';

// From backend.json entities
export interface UserProfile extends DocumentData {
    id: string;
    email: string;
    name: string;
    createdAt: Timestamp | string;
    updatedAt: Timestamp | string;
    initialCashBalance?: number;
}

export interface Project extends DocumentData {
    id: string;
    userId: string;
    name: string;
    client: string;
    startDate: string;
    status: ProjectStatus;
    plannedTotalCost: number;
    plannedTotalRevenue: number;
    actualTotalCost: number;
    actualTotalRevenue: number;
    description?: string;
    createdAt: Timestamp | string;
    updatedAt: Timestamp | string;
}

export interface CostCategory extends DocumentData {
    id: string;
    userId: string;
    name: string;
    createdAt: Timestamp | string;
}

export interface CostItem extends DocumentData {
    id: string;
    projectId?: string;
    userId: string;
    name: string;
    supplier?: string;
    category: string;
    plannedAmount: number;
    actualAmount: number;
    status: CostItemStatus;
    transactionDate: string;
    description?: string;
    isInstallment: boolean;
    installmentNumber?: number;
    totalInstallments?: number;
    isRecurring?: boolean;
    frequency?: 'monthly' | 'annually';
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

// Transaction is a derived type for the cashflow tab, not a direct Firestore entity.
export type Transaction = {
  id: string;
  type: 'Receita' | 'Custo';
  description: string;
  amount: number;
  date: string;
  category: string;
  project: string;
  status: 'Pendente' | 'Recebido' | 'Pago';
};

// For charts
export interface MonthlyIOData {
    month: string;
    entradas: number;
    saidas: number;
}

export type CostItemFormData = Omit<CostItem, 'id' | 'createdAt' | 'updatedAt' | 'deviationAnalysisNote'>;
export type RevenueItemFormData = Omit<RevenueItem, 'id' | 'createdAt' | 'updatedAt'>;

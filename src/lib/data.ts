import type { Project, Cost, Revenue, Transaction } from './types';

export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'Desenvolvimento de E-commerce',
    client: 'Varejo Top',
    startDate: '2024-05-01',
    endDate: '2024-10-31',
    status: 'Em andamento',
  },
  {
    id: 'proj-2',
    name: 'Campanha de Marketing Digital',
    client: 'Startup Inovadora',
    startDate: '2024-06-15',
    endDate: '2024-09-15',
    status: 'Em andamento',
  },
  {
    id: 'proj-3',
    name: 'Consultoria de SEO',
    client: 'Blog de Viagens',
    startDate: '2024-03-01',
    endDate: '2024-05-30',
    status: 'Concluído',
  },
  {
    id: 'proj-4',
    name: 'Redesign de Website Corporativo',
    client: 'Indústria Pesada S.A.',
    startDate: '2024-07-01',
    endDate: '2024-12-20',
    status: 'Em andamento',
  },
    {
    id: 'proj-5',
    name: 'Desenvolvimento de App Mobile',
    client: 'HealthTech Vital',
    startDate: '2024-02-01',
    endDate: '2024-08-30',
    status: 'Concluído',
  },
];

export const costs: Cost[] = [
  // Project 1
  { id: 'cost-1', projectId: 'proj-1', category: 'Mão de obra', description: 'Desenvolvedor Frontend', predictedAmount: 15000, actualAmount: 15500, date: '2024-06-05', isRecurring: false },
  { id: 'cost-2', projectId: 'proj-1', category: 'Software', description: 'Licença de Figma', predictedAmount: 500, actualAmount: 500, date: '2024-05-10', isRecurring: true },
  { id: 'cost-3', projectId: 'proj-1', category: 'Materiais', description: 'Compra de templates', predictedAmount: 800, actualAmount: 750, date: '2024-05-20', isRecurring: false },

  // Project 2
  { id: 'cost-4', projectId: 'proj-2', category: 'Marketing', description: 'Anúncios Google Ads', predictedAmount: 5000, actualAmount: 5200, date: '2024-07-01', isRecurring: false },
  { id: 'cost-5', projectId: 'proj-2', category: 'Mão de obra', description: 'Gerente de Mídia Social', predictedAmount: 4000, actualAmount: 4000, date: '2024-07-05', isRecurring: true },
  
  // Project 3
  { id: 'cost-6', projectId: 'proj-3', category: 'Mão de obra', description: 'Analista de SEO', predictedAmount: 6000, actualAmount: 6000, date: '2024-04-01', isRecurring: false },
  
  // Project 4
  { id: 'cost-7', projectId: 'proj-4', category: 'Mão de obra', description: 'UI/UX Designer', predictedAmount: 8000, actualAmount: 0, date: '2024-07-15', isRecurring: false },
  { id: 'cost-8', projectId: 'proj-4', category: 'Software', description: 'Adobe Creative Cloud', predictedAmount: 300, actualAmount: 0, date: '2024-07-05', isRecurring: true },

  // Project 5
  { id: 'cost-9', projectId: 'proj-5', category: 'Mão de obra', description: 'Desenvolvedor iOS', predictedAmount: 20000, actualAmount: 21500, date: '2024-03-10', isRecurring: false },
  { id: 'cost-10', projectId: 'proj-5', category: 'Marketing', description: 'Campanha de lançamento', predictedAmount: 7000, actualAmount: 8500, date: '2024-08-01', isRecurring: false },
];

export const revenues: Revenue[] = [
  // Project 1
  { id: 'rev-1', projectId: 'proj-1', description: 'Entrada do projeto', predictedAmount: 20000, actualAmount: 20000, date: '2024-05-05', paymentMethod: 'Transferência Bancária', installments: 1 },
  { id: 'rev-2', projectId: 'proj-1', description: 'Segunda parcela', predictedAmount: 15000, actualAmount: 0, date: '2024-08-05', paymentMethod: 'Transferência Bancária', installments: 1 },

  // Project 2
  { id: 'rev-3', projectId: 'proj-2', description: 'Pagamento único', predictedAmount: 12000, actualAmount: 12000, date: '2024-06-20', paymentMethod: 'Cartão de Crédito', installments: 1 },
  
  // Project 3
  { id: 'rev-4', projectId: 'proj-3', description: 'Pagamento final', predictedAmount: 10000, actualAmount: 10000, date: '2024-06-01', paymentMethod: 'Dinheiro', installments: 1 },

  // Project 4
  { id: 'rev-5', projectId: 'proj-4', description: 'Sinal', predictedAmount: 12500, actualAmount: 12500, date: '2024-07-01', paymentMethod: 'Transferência Bancária', installments: 1 },
  { id: 'rev-6', projectId: 'proj-4', description: 'Entrega de layout', predictedAmount: 12500, actualAmount: 0, date: '2024-09-01', paymentMethod: 'Transferência Bancária', installments: 1 },

  // Project 5
  { id: 'rev-7', projectId: 'proj-5', description: 'Pagamento total', predictedAmount: 50000, actualAmount: 50000, date: '2024-02-15', paymentMethod: 'Cartão de Crédito', installments: 3 },
];

export const transactions: Transaction[] = [
  ...revenues.map(r => ({
    id: `trans-rev-${r.id}`,
    type: 'Receita' as const,
    description: r.description,
    amount: r.actualAmount > 0 ? r.actualAmount : r.predictedAmount,
    date: r.date,
    category: 'Receita' as const,
    project: projects.find(p => p.id === r.projectId)?.name || 'N/A',
    status: r.actualAmount > 0 ? 'Recebido' as const : 'Pendente' as const,
  })),
  ...costs.map(c => ({
    id: `trans-cost-${c.id}`,
    type: 'Custo' as const,
    description: c.description,
    amount: c.actualAmount > 0 ? c.actualAmount : c.predictedAmount,
    date: c.date,
    category: c.category,
    project: projects.find(p => p.id === c.projectId)?.name || 'N/A',
    status: c.actualAmount > 0 ? 'Pago' as const : 'Pendente' as const,
  })),
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

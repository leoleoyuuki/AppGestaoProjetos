'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import type { CostItem, RevenueItem } from '@/lib/types';
import { useMemo } from 'react';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CircleDollarSign, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WeeklySummary() {
  const { user } = useUser();
  const firestore = useFirestore();

  const costsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/costItems`));
  }, [firestore, user]);
  const { data: costs, isLoading: costsLoading } = useCollection<CostItem>(costsQuery);

  const revenuesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collectionGroup(firestore, 'revenueItems'));
  }, [firestore, user]);
  const { data: revenues, isLoading: revenuesLoading } = useCollection<RevenueItem>(revenuesQuery);
  
  const userRevenues = useMemo(() => {
      if (!revenues || !user) return [];
      return revenues.filter(r => r.userId === user.uid);
  }, [revenues, user]);

  const { upcomingPayments, upcomingReceivables } = useMemo(() => {
    if (!costs || !userRevenues) return { upcomingPayments: [], upcomingReceivables: [] };

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    const payments = costs.filter(cost => {
      const isPending = cost.status === 'Pendente';
      const transactionDate = parseISO(cost.transactionDate);
      const isThisWeek = isWithinInterval(transactionDate, { start: weekStart, end: weekEnd });
      return isPending && isThisWeek;
    });

    const receivables = userRevenues.filter(revenue => {
      const isPending = revenue.receivedAmount === 0;
      const transactionDate = parseISO(revenue.transactionDate);
      const isThisWeek = isWithinInterval(transactionDate, { start: weekStart, end: weekEnd });
      return isPending && isThisWeek;
    });

    return { upcomingPayments: payments, upcomingReceivables: receivables };
  }, [costs, userRevenues]);

  const totalToPay = useMemo(() => upcomingPayments.reduce((acc, cost) => acc + cost.plannedAmount, 0), [upcomingPayments]);
  const totalToReceive = useMemo(() => upcomingReceivables.reduce((acc, revenue) => acc + revenue.plannedAmount, 0), [upcomingReceivables]);

  const isLoading = costsLoading || revenuesLoading;
  
  if (isLoading) {
    return (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    );
  }

  if (upcomingPayments.length === 0 && upcomingReceivables.length === 0) {
    return null;
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      {upcomingPayments.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {upcomingPayments.length} conta(s) a pagar esta semana!
          </AlertTitle>
          <AlertDescription>
            <p>Totalizando {formatCurrency(totalToPay)}. Não se esqueça de efetuar os pagamentos.</p>
            <ul className="mt-2 list-disc pl-5 text-xs">
                {upcomingPayments.map(cost => (
                    <li key={cost.id}>
                        {cost.name} - {formatCurrency(cost.plannedAmount)} ({new Date(cost.transactionDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })})
                    </li>
                ))}
            </ul>
            <Button asChild variant="secondary" size="sm" className="mt-4">
              <Link href="/dashboard/costs?tab=this-week">
                Ver Contas a Pagar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
       {upcomingReceivables.length > 0 && (
        <Alert>
          <CircleDollarSign className="h-4 w-4" />
          <AlertTitle>
            {upcomingReceivables.length} conta(s) a receber esta semana!
          </AlertTitle>
          <AlertDescription>
             <p>Você tem {formatCurrency(totalToReceive)} para receber. Acompanhe as entradas.</p>
             <ul className="mt-2 list-disc pl-5 text-xs">
                {upcomingReceivables.map(rev => (
                    <li key={rev.id}>
                        {rev.name} - {formatCurrency(rev.plannedAmount)} ({new Date(rev.transactionDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })})
                    </li>
                ))}
            </ul>
            <Button asChild variant="secondary" size="sm" className="mt-4">
                <Link href="/dashboard/revenue?tab=this-week">
                    Ver Contas a Receber
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

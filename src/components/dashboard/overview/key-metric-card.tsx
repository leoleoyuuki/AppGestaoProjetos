"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import type { Project, RevenueItem, ProjectStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface KeyMetricCardProps {
  title: string;
  isPrimary?: boolean;
  statusKey?: ProjectStatus;
  isProfit?: boolean;
  isPendingRevenue?: boolean;
}

export default function KeyMetricCard({ title, isPrimary, statusKey, isProfit, isPendingRevenue }: KeyMetricCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'projects'));
  }, [firestore, user]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const revenueItemsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collectionGroup(firestore, 'revenueItems'));
  }, [firestore, user]);
  const { data: revenueItems, isLoading: revenuesLoading } = useCollection<RevenueItem>(revenueItemsQuery);
  
  const isLoading = projectsLoading || revenuesLoading;

  let value: string | number = 0;
  let subText: string | undefined;

  if (!isLoading) {
    if (statusKey) {
      value = projects?.filter(p => p.status === statusKey).length || 0;
      subText = `Increased from last month`;
    } else if (isProfit) {
      const totalActualProfit = projects?.reduce((acc, proj) => acc + (proj.actualTotalRevenue - proj.actualTotalCost), 0) || 0;
      value = formatCurrency(totalActualProfit);
       subText = `Increased from last month`;
    } else if (isPendingRevenue) {
       const userPendingRevenue = revenueItems?.filter(r => r.userId === user?.uid && r.receivedAmount === 0) || [];
       const pendingRevenue = userPendingRevenue.reduce((acc, r) => acc + r.plannedAmount, 0) || 0;
       value = formatCurrency(pendingRevenue);
       subText = 'On Discuss';
    }
  }


  return (
    <Card className={cn("rounded-2xl", isPrimary && "bg-primary text-primary-foreground")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <button className={cn("p-1 rounded-full", isPrimary ? 'bg-white/20' : 'bg-muted')}>
            <ArrowUpRight className={cn("h-4 w-4", isPrimary ? 'text-primary-foreground' : 'text-foreground')} />
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className={cn("h-8 w-16 mt-1", isPrimary && "bg-white/50")} />
            <Skeleton className={cn("h-4 w-32 mt-2", isPrimary && "bg-white/50")} />
          </>
        ) : (
          <>
            <div className="text-4xl font-bold">{value}</div>
            {subText && <p className={cn("text-xs", isPrimary ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{subText}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

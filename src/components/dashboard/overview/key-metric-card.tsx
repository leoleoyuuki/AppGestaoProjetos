"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KeyMetricCardProps {
  title: string;
  value: string;
  subText?: string;
  Icon: LucideIcon;
  isLoading: boolean;
  isNegative?: boolean;
}

export default function KeyMetricCard({ title, value, subText, Icon, isLoading, isNegative = false }: KeyMetricCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mt-1" />
            <Skeleton className="h-4 w-32 mt-2" />
          </>
        ) : (
          <>
            <div className={cn("text-2xl font-bold", isNegative && "text-destructive")}>{value}</div>
            {subText && <p className="text-xs text-muted-foreground">{subText}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

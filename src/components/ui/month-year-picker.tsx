'use client';

import * as React from 'react';
import { format, setMonth, setYear, getYear, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface MonthYearPickerProps {
  date: Date | undefined;
  onDateChange: (date: Date) => void;
}

export function MonthYearPicker({ date, onDateChange }: MonthYearPickerProps) {
  const [displayYear, setDisplayYear] = React.useState(date ? getYear(date) : getYear(new Date()));

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(setYear(new Date(), displayYear), monthIndex);
    onDateChange(newDate);
  };

  return (
    <div className="p-3 w-64">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setDisplayYear(displayYear - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold text-sm">{displayYear}</div>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setDisplayYear(displayYear + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 12 }).map((_, i) => {
          const monthDate = setMonth(new Date(), i);
          const isSelected = date && getMonth(date) === i && getYear(date) === displayYear;

          return (
            <Button
              key={i}
              variant={isSelected ? 'default' : 'ghost'}
              className={cn('capitalize h-8 text-xs')}
              onClick={() => handleMonthSelect(i)}
            >
              {format(monthDate, 'MMM', { locale: ptBR }).replace('.', '')}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

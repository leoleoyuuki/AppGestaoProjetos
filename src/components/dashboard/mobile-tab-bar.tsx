'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Wallet, Plus, CircleDollarSign, Briefcase, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CostItemDialog } from './cost-item-dialog';
import { RevenueItemDialog } from './revenue-item-dialog';
import { ProjectDialog } from './project-dialog';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Project } from '@/lib/types';

export default function MobileTabBar() {
  const pathname = usePathname();
  const [isCostDialogOpen, setCostDialogOpen] = useState(false);
  const [isRevenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/projects`));
  }, [firestore, user]);
  const { data: projects } = useCollection<Project>(projectsQuery);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };
  
  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/costs', icon: Wallet, label: 'Pagar' },
    null, // Placeholder for the Add button
    { href: '/dashboard/revenue', icon: CircleDollarSign, label: 'Receber' },
    { href: '/dashboard/projects', icon: Briefcase, label: 'Projetos' },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t z-20 pb-8">
        <div className="grid h-[60px] grid-cols-5 items-center">
          {navItems.map((item, index) => {
            if (!item) {
              return (
                <div key={index} className="flex justify-center items-center">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button size="icon" className="w-14 h-14 rounded-full -translate-y-4 shadow-lg bg-primary hover:bg-primary/90">
                        <Plus className="w-6 h-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="center" className="w-56 mb-2">
                       <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setProjectDialogOpen(true)}>
                          <Briefcase className="mr-2 h-4 w-4" />
                          <span>Novo Projeto</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setRevenueDialogOpen(true)}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          <span>Nova Receita</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setCostDialogOpen(true)}>
                          <TrendingDown className="mr-2 h-4 w-4" />
                          <span>Novo Custo</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-xs h-full',
                  isActive(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      {projects && (
        <>
          <ProjectDialog isOpen={isProjectDialogOpen} onOpenChange={setProjectDialogOpen} />
          <CostItemDialog 
              isOpen={isCostDialogOpen}
              onOpenChange={setCostDialogOpen}
              projects={projects}
          />
          <RevenueItemDialog 
              isOpen={isRevenueDialogOpen}
              onOpenChange={setRevenueDialogOpen}
              projects={projects}
          />
        </>
      )}
    </>
  );
}

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Bell } from 'lucide-react';

interface HeaderProps {
  currentView: string;
}

const viewTitles: { [key: string]: string } = {
  overview: 'Visão Geral do Projeto',
  costs: 'Gestão de Custos',
  revenue: 'Rastreamento de Receitas',
  cashflow: 'Gestão de Fluxo de Caixa',
  reports: 'Relatórios Financeiros',
};

export default function Header({ currentView }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-2xl">{viewTitles[currentView] || 'Painel'}</h1>
      </div>
      <div className="flex flex-1 items-center gap-4 md:ml-auto md:flex-none">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar projetos..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notificações</span>
           <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent/80"></span>
            </span>
        </Button>
      </div>
    </header>
  );
}

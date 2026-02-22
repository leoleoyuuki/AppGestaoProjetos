'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Logo from '@/components/logo';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  PieChart,
  Settings,
  CircleHelp,
  TrendingUp,
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface AppSidebarProps {
  activeView: string;
  setActiveView: Dispatch<SetStateAction<string>>;
}

const navItems = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'costs', label: 'Gestão de Custos', icon: Wallet },
  { id: 'revenue', label: 'Rastreamento de Receitas', icon: TrendingUp },
  { id: 'cashflow', label: 'Fluxo de Caixa', icon: ArrowRightLeft },
  { id: 'reports', label: 'Relatórios', icon: PieChart },
];

export default function AppSidebar({ activeView, setActiveView }: AppSidebarProps) {
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => setActiveView(item.id)}
                isActive={activeView === item.id}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto">
         <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Ajuda">
                <CircleHelp />
                <span>Ajuda</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Configurações">
                <Settings />
                <span>Configurações</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <SidebarMenuButton size="lg" className="justify-start gap-2 h-auto p-2">
                 {userAvatar && <Avatar className="size-8">
                    <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" data-ai-hint={userAvatar.imageHint} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>}
                  <div className="flex flex-col items-start truncate">
                      <span className="font-medium text-sm leading-tight">Usuário</span>
                      <span className="text-xs text-sidebar-foreground/70 leading-tight">usuario@finestra.com</span>
                  </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

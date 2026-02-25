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
import Logo from '@/components/logo';
import {
  LayoutDashboard,
  Settings,
  CircleHelp,
  LogOut,
  Wallet,
  BarChart3,
  ArrowLeftRight,
  Briefcase,
  CircleDollarSign,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import Image from 'next/image';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'projects', label: 'Projetos', icon: Briefcase, href: '/dashboard/projects' },
  { id: 'costs', label: 'Contas a Pagar', icon: Wallet, href: '/dashboard/costs' },
  { id: 'revenue', label: 'Contas a Receber', icon: CircleDollarSign, href: '/dashboard/revenue' },
  { id: 'cashflow', label: 'Fluxo de Caixa', icon: ArrowLeftRight, href: '/dashboard/cashflow' },
  { id: 'reports', label: 'Relatórios', icon: BarChart3, href: '/dashboard/reports' },
];

const generalItems = [
    { id: 'settings', label: 'Configurações', icon: Settings, href: '/dashboard/settings' },
    { id: 'help', label: 'Ajuda', icon: CircleHelp, href: '#' },
    { id: 'logout', label: 'Sair', icon: LogOut, href: '#' },
]

export default function AppSidebar() {
  const auth = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const downloadAppImage = PlaceHolderImages.find((img) => img.id === 'download-app-bg');

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Sucesso', description: 'Sessão encerrada com sucesso.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    // For settings, it's a specific page
    if (href.includes('settings')) return pathname === href;
    return pathname.startsWith(href) && href !== '/dashboard';
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="h-20">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-4">
            <div>
                <span className="text-xs text-muted-foreground px-2">MENU</span>
                <SidebarMenu>
                {navItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                          asChild
                          isActive={isActive(item.href)}
                          tooltip={item.label}
                          className={cn("justify-start", isActive(item.href) && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary")}
                      >
                        <Link href={item.href}>
                            <item.icon className={cn(isActive(item.href) && "text-primary")} />
                            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </div>

            <div>
                <span className="text-xs text-muted-foreground px-2">GERAL</span>
                <SidebarMenu>
                {generalItems.map((item) => (
                     <SidebarMenuItem key={item.id}>
                        {item.id === 'logout' ? (
                           <SidebarMenuButton
                                onClick={handleSignOut}
                                tooltip={item.label}
                                className="justify-start text-muted-foreground hover:text-foreground"
                            >
                                <item.icon />
                                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                            </SidebarMenuButton>
                        ) : (
                          <SidebarMenuButton
                            asChild
                            isActive={isActive(item.href)}
                            tooltip={item.label}
                            className={cn("justify-start text-muted-foreground hover:text-foreground", isActive(item.href) && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary")}
                          >
                           <Link href={item.href}>
                              <item.icon className={cn(isActive(item.href) && "text-primary")} />
                              <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </div>
        </div>

      </SidebarContent>
      <SidebarFooter className="mt-auto p-2">
         <Card className="relative overflow-hidden bg-primary text-primary-foreground group-data-[collapsible=icon]:p-0">
            <div className="group-data-[collapsible=icon]:hidden">
                {downloadAppImage && (
                <Image src={downloadAppImage.imageUrl} alt="Download App background" fill objectFit="cover" className="opacity-20" />
                )}
            </div>
            <CardContent className="relative z-10 p-3 text-center">
                 <div className="mb-2 mt-1 rounded-full bg-white/30 size-8 mx-auto flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.6 12.54L12.82 16.32C12.44 16.7 11.8 16.7 11.42 16.32L7.4 12.3C7.02 11.92 7.16 11.26 7.68 11.12L11.5 10.02C11.78 9.94 12.06 10.04 12.24 10.26L13.6 11.98L15.54 9.18C15.86 8.72 16.5 8.84 16.66 9.34L17.44 11.8C17.56 12.2 17.28 12.62 16.82 12.66L16.6 12.54Z" fill="currentColor"/>
                    </svg>
                 </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <h3 className="font-semibold text-sm">Download our Mobile App</h3>
                  <p className="text-xs text-primary-foreground/80 mb-3">Get easy in another way</p>
                  <Button variant="secondary" size="sm" className="w-full text-primary">Download</Button>
                </div>
            </CardContent>
         </Card>
      </SidebarFooter>
    </Sidebar>
  );
}

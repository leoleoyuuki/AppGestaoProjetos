import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Bell, Mail, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Success', description: 'Signed out successfully' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search task..."
              className="pl-9 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-card border-none rounded-full"
            />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono p-1 border rounded-md">⌘ F</div>
          </div>
        </form>
      </div>
      <div className="flex items-center gap-4 md:ml-auto">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Mail className="h-5 w-5" />
          <span className="sr-only">Messages</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificações</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              {userAvatar && (
                <Avatar>
                  <AvatarImage src={user?.photoURL || userAvatar.imageUrl} alt="User Avatar" data-ai-hint={userAvatar.imageHint} />
                  <AvatarFallback>{user?.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName || (user?.isAnonymous ? 'Anonymous User' : 'User')}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'anon@donezo.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

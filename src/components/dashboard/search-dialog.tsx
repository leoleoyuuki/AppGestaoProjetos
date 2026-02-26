'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

export function SearchDialog({ isOpen, onOpenChange, initialQuery = '' }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { user } = useUser();
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/projects`));
  }, [firestore, user]);

  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery.trim()) return []; // Return empty if search is empty, don't show all projects

    const lowercasedQuery = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(lowercasedQuery) ||
        project.client.toLowerCase().includes(lowercasedQuery)
    );
  }, [projects, searchQuery]);
  
  // Update internal query state if initialQuery from header changes, but only when dialog opens
  useEffect(() => {
    if(isOpen) {
        setSearchQuery(initialQuery);
    }
  }, [initialQuery, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Busca Global</DialogTitle>
          <DialogDescription>
            Busque por nome do projeto ou cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto -mx-6 px-6 border-t mt-4 pt-4">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {!isLoading && searchQuery.trim() && filteredProjects.length > 0 && (
            <div className="space-y-1">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  onClick={() => onOpenChange(false)}
                  className="block p-3 rounded-md hover:bg-accent -mx-3"
                >
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground">{project.client}</p>
                </Link>
              ))}
            </div>
          )}
          {!isLoading && searchQuery.trim() && filteredProjects.length === 0 && (
             <div className="text-center py-10 text-muted-foreground">
              <p className="mt-4 text-sm">
                Nenhum projeto encontrado para "{searchQuery}".
              </p>
            </div>
          )}
          {!isLoading && !searchQuery.trim() && (
             <div className="text-center py-10 text-muted-foreground">
                <Search className="mx-auto h-12 w-12" />
                <p className="mt-4 text-sm">
                    Comece a digitar para buscar seus projetos.
                </p>
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

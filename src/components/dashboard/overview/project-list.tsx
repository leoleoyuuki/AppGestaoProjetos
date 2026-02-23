"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, Briefcase } from 'lucide-react';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function ProjectList() {
    const { user } = useUser();
    const firestore = useFirestore();

    const projectsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/projects`));
    }, [firestore, user]);
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    return (
        <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Projetos</CardTitle>
                <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />Novo</Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {projectsLoading ? (
                        <>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </>
                    ) : (
                       projects?.slice(0, 5).map(project => (
                            <div key={project.id} className="flex items-center gap-4">
                                <div className="p-3 bg-muted rounded-full">
                                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{project.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Prazo: {format(new Date(project.endDate), 'dd/MM/yyyy')}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                     {!projectsLoading && projects?.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum projeto encontrado.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

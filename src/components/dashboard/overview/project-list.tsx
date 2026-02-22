"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, CheckCircle, Workflow, CircleHelp, Loader } from 'lucide-react';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const iconMap = {
  "Develop API Endpoints": <Workflow className="text-blue-500" />,
  "Onboarding Flow": <CheckCircle className="text-green-500" />,
  "Build Dashboard": <Workflow className="text-blue-500" />,
  "Optimize Page Load": <CircleHelp className="text-yellow-500" />,
  "Cross-Browser Testing": <Loader className="text-purple-500" />,
}

export default function ProjectList() {
    const { user } = useUser();
    const firestore = useFirestore();

    const projectsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/projects`));
    }, [firestore, user]);
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    const getIcon = (projectName: string) => {
        const key = Object.keys(iconMap).find(key => projectName.includes(key.split(' ')[0]));
        return key ? iconMap[key as keyof typeof iconMap] : <Workflow className="text-gray-500" />;
    }

    return (
        <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Project</CardTitle>
                <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />New</Button>
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
                                <div className="p-2 bg-muted rounded-full">
                                    {getIcon(project.name)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{project.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Due date: {format(new Date(project.endDate), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

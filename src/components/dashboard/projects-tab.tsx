'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ProjectsTable from './projects-table';
import { ProjectDialog } from './project-dialog';

export default function ProjectsTab() {
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Todos os Projetos</CardTitle>
            <Button size="sm" onClick={() => setProjectDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Projeto
            </Button>
          </CardHeader>
          <CardContent>
            <ProjectsTable />
          </CardContent>
        </Card>
      </div>
      <ProjectDialog isOpen={isProjectDialogOpen} onOpenChange={setProjectDialogOpen} />
    </>
  );
}

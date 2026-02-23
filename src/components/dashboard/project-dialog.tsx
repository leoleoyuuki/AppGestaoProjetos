'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser, useFirestore } from '@/firebase';
import type { Project } from '@/lib/types';
import { ProjectForm, type ProjectFormValues } from './project-form';
import { addProject, updateProject } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface ProjectDialogProps {
  project?: Project;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDialog({ project, isOpen, onOpenChange }: ProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSubmit = async (values: ProjectFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }

    setIsSubmitting(true);
    const projectData = {
      ...values,
      startDate: values.startDate.toISOString().split('T')[0], // format to 'YYYY-MM-DD'
      userId: user.uid
    };

    try {
      if (project) {
        // Update existing project
        updateProject(firestore, user.uid, project.id, projectData);
        toast({ title: 'Sucesso!', description: 'Projeto atualizado.' });
      } else {
        // Create new project
        addProject(firestore, user.uid, projectData);
        toast({ title: 'Sucesso!', description: 'Projeto criado.' });
      }
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o projeto.' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? 'Editar Projeto' : 'Adicionar Novo Projeto'}</DialogTitle>
          <DialogDescription>
            {project ? 'Edite os detalhes do seu projeto.' : 'Preencha os detalhes para criar um novo projeto.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ProjectForm
            project={project}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

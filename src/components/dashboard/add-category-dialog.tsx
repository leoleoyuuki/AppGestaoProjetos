'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { addCostCategory } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { Label } from '../ui/label';

interface AddCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCategoryDialog({ isOpen, onOpenChange }: AddCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleAddCategory = async () => {
    if (!user || !categoryName.trim()) {
      toast({ variant: 'destructive', title: 'Erro', description: 'O nome da categoria não pode ser vazio.' });
      return;
    }
    setIsSubmitting(true);
    try {
      addCostCategory(firestore, user.uid, categoryName.trim());
      toast({ title: 'Sucesso', description: `Categoria "${categoryName.trim()}" adicionada.` });
      setCategoryName('');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar a categoria.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Categoria</DialogTitle>
          <DialogDescription>
            Digite o nome para a nova categoria de custo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <Label htmlFor="category-name">Nome da Categoria</Label>
            <Input
                id="category-name"
                placeholder="Ex: Viagem"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') handleAddCategory() }}
                disabled={isSubmitting}
            />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddCategory} disabled={isSubmitting || !categoryName.trim()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

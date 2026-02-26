'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { addCostCategory, deleteCostCategory } from '@/lib/actions';
import type { CostCategory } from '@/lib/types';

export function CostCategoryManager() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/costCategories`));
  }, [firestore, user]);
  const { data: categories, isLoading } = useCollection<CostCategory>(categoriesQuery);

  const handleAddCategory = async () => {
    if (!user || !newCategoryName.trim()) {
      toast({ variant: 'destructive', title: 'Erro', description: 'O nome da categoria não pode ser vazio.' });
      return;
    }
    setIsSubmitting(true);
    await addCostCategory(firestore, user.uid, newCategoryName.trim());
    toast({ title: 'Sucesso', description: `Categoria "${newCategoryName.trim()}" adicionada.` });
    setNewCategoryName('');
    setIsSubmitting(false);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user) return;
    await deleteCostCategory(firestore, user.uid, categoryId);
    toast({ title: 'Sucesso', description: 'Categoria removida.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorias de Custo</CardTitle>
        <CardDescription>Gerencie suas categorias de custo personalizadas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Nova categoria..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={isSubmitting}
          />
          <Button onClick={handleAddCategory} disabled={isSubmitting || !newCategoryName.trim()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
        <div className="space-y-2">
          {isLoading && (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          )}
          {categories?.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-2 border rounded-md bg-background">
              <span>{category.name}</span>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {!isLoading && categories?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria encontrada.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

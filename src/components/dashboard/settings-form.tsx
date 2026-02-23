'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { updateUserProfile, createUserProfile } from '@/lib/actions';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  initialCashBalance: z.coerce.number().optional(),
});

export default function SettingsForm() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      initialCashBalance: 0,
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({ 
        name: userProfile.name, 
        initialCashBalance: userProfile.initialCashBalance || 0 
      });
    } else if (user?.displayName) {
      form.reset({ name: user.displayName, initialCashBalance: 0 });
    }
  }, [user, userProfile, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update Firebase Auth display name first
      if(user.displayName !== values.name) {
        await updateProfile(user, { displayName: values.name });
      }

      // Check if the Firestore document exists
      if (userProfile) {
        // If it exists, update it
        updateUserProfile(firestore, user.uid, { 
          name: values.name,
          initialCashBalance: values.initialCashBalance || 0,
        });
      } else {
        // If it does not exist, create it
        await createUserProfile(firestore, user.uid, user.email, values.name);
        // Then update it with the initial cash balance if provided
        if (values.initialCashBalance) {
            updateUserProfile(firestore, user.uid, { 
                initialCashBalance: values.initialCashBalance
            });
        }
      }

      toast({ title: 'Sucesso!', description: 'Seu perfil foi atualizado.' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message,
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isProfileLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu Perfil</CardTitle>
        <CardDescription>Atualize seu nome de exibição e saldo inicial.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Exibição</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="initialCashBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>
                    Este é o ponto de partida para o cálculo do seu fluxo de caixa.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

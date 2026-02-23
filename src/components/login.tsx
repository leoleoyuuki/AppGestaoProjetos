'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Logo from './logo';
import { createUserProfile } from '@/lib/actions';

export default function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSigningUp) {
        if (!name) {
          toast({
            variant: 'destructive',
            title: 'Erro de Validação',
            description: 'O nome é obrigatório para o cadastro.',
          });
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        createUserProfile(
          firestore,
          userCredential.user.uid,
          userCredential.user.email,
          name
        );
        toast({ title: 'Sucesso', description: 'Conta criada com sucesso!' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Sucesso', description: 'Login efetuado com sucesso!' });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: error.message,
      });
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously(auth);
      toast({ title: 'Sucesso', description: 'Login anônimo efetuado com sucesso!' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: error.message,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl text-center">
            {isSigningUp ? 'Criar Conta' : 'Login'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSigningUp
              ? 'Insira suas informações para criar uma conta'
              : 'Insira seu email para acessar sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuthAction} className="grid gap-4">
            {isSigningUp && (
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              {isSigningUp ? 'Criar conta' : 'Login'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAnonymousSignIn}
              type="button"
            >
              Acessar como convidado
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSigningUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <button
              onClick={() => setIsSigningUp(!isSigningUp)}
              className="underline"
            >
              {isSigningUp ? 'Login' : 'Cadastre-se'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

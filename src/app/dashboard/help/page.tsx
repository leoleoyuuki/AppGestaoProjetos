'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Smartphone, Monitor, ArrowDown, MoreVertical, Share } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ajuda e Suporte</h1>
        <p className="text-muted-foreground">
          Aprenda a instalar o Finestra no seu dispositivo para uma experiência mais rápida e integrada.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            <span>Instalando no Celular (iOS & Android)</span>
          </CardTitle>
          <CardDescription>
            Siga estes passos para adicionar o Finestra à sua tela de início.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                    <Share className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold">Passo 1: Abra o menu de compartilhamento</p>
                    <p className="text-muted-foreground">Toque no ícone de "Compartilhar" no seu navegador (geralmente na parte inferior ou superior da tela).</p>
                </div>
            </div>
             <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                    <ArrowDown className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold">Passo 2: Adicionar à Tela de Início</p>
                    <p className="text-muted-foreground">Procure e selecione a opção "Adicionar à Tela de Início" ou "Instalar aplicativo".</p>
                </div>
            </div>
             <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                    <Smartphone className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold">Passo 3: Confirme</p>
                    <p className="text-muted-foreground">Confirme o nome do aplicativo e toque em "Adicionar". O ícone do Finestra aparecerá na sua tela de início, como um app nativo.</p>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Monitor className="h-6 w-6" />
                <span>Instalando no Computador (Chrome, Edge, etc.)</span>
            </CardTitle>
            <CardDescription>
                Use o Finestra como um aplicativo de desktop.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                    <Monitor className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold">Passo 1: Ícone de Instalação</p>
                    <p className="text-muted-foreground">Na barra de endereço do navegador, procure por um ícone de um monitor com uma seta para baixo.</p>
                </div>
            </div>
             <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                    <ArrowDown className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold">Passo 2: Clique em Instalar</p>
                    <p className="text-muted-foreground">Clique neste ícone e depois no botão "Instalar" que aparecerá.</p>
                </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                    <MoreVertical className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold">Alternativa (se o ícone não aparecer)</p>
                    <p className="text-muted-foreground">Clique no menu de três pontos do navegador (...) e procure pela opção "Instalar Finestra" ou "Instalar este site como um aplicativo".</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

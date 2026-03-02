# Guia de Desenvolvimento do Projeto: Finestra Financials

Este documento serve como um guia de desenvolvimento e "memória" para a IA Gemini, descrevendo a arquitetura, padrões e tecnologias do projeto Finestra.

## 1. Visão Geral e Tecnologias

- **Propósito**: Aplicação de gestão financeira para projetos, permitindo o controle de custos e receitas.
- **Stack Principal**:
  - **Framework**: Next.js (App Router)
  - **Linguagem**: TypeScript
  - **Backend & DB**: Firebase (Authentication, Firestore)
  - **UI**: React, ShadCN, Tailwind CSS
  - **Gráficos**: Recharts
  - **Formulários**: React Hook Form com Zod para validação
  - **IA**: Genkit para funcionalidades de IA

## 2. Arquitetura do Firebase

O Firebase é o coração do backend. A interação com ele segue padrões específicos para garantir segurança e performance.

### 2.1. Estrutura de Dados (Firestore)

A estrutura é centrada no usuário, com todos os dados aninhados sob a coleção `/users/{userId}`.

- `/users/{userId}`: (Entidade: `UserProfile`) Armazena dados do perfil do usuário.
- `/users/{userId}/projects/{projectId}`: (Entidade: `Project`) Coleção de projetos do usuário.
- `/users/{userId}/costItems/{costItemId}`: (Entidade: `CostItem`) Coleção de todos os custos do usuário. Podem ou não estar associados a um `projectId`.
- `/users/{userId}/costCategories/{costCategoryId}`: (Entidade: `CostCategory`) Categorias de custo personalizadas pelo usuário.
- `/users/{userId}/projects/{projectId}/revenueItems/{revenueItemId}`: (Entidade: `RevenueItem`) **Subcoleção** de um projeto específico.

**Ponto Crítico de Segurança**: As regras do Firestore (`firestore.rules`) garantem que um usuário só pode acessar documentos dentro do seu próprio caminho (`/users/{request.auth.uid}`). **Qualquer consulta a uma coleção deve, obrigatoriamente, incluir um filtro `where('userId', '==', user.uid)` se não estiver aninhada sob um caminho que já garanta essa segurança.**

### 2.2. Ações no Banco de Dados (`src/lib/actions.ts`)

- **Centralização**: Toda a lógica de escrita, atualização e exclusão de dados no Firestore está centralizada neste arquivo.
- **Padrão de Funções**: Funções como `addProject`, `updateCostItem`, `deleteRevenueItem` recebem a instância do `firestore`, o `userId` e os dados necessários.
- **Atualizações de Totais**: Funções que modificam custos ou receitas (ex: `payCostItem`, `receiveRevenueItem`) também são responsáveis por atualizar os campos `actualTotalCost` e `actualTotalRevenue` nos documentos de `Project` usando `increment()`.
- **Tratamento de Erro**: As ações usam um padrão não-bloqueante (`.catch()`) para capturar erros de permissão e emiti-los globalmente através do `errorEmitter`, utilizando a classe `FirestorePermissionError`.

### 2.3. Hooks do Firebase

A aplicação utiliza hooks personalizados para interagir com o Firebase de forma reativa.

- **`useUser()`**: Retorna o estado atual do usuário (`user`, `isUserLoading`). Usado para proteger rotas e obter o UID do usuário.
- **`useFirestore()` / `useAuth()`**: Retornam as instâncias dos serviços do Firebase.
- **`useCollection<T>(query)`**: Escuta em tempo real uma coleção ou consulta.
- **`useDoc<T>(docRef)`**: Escuta em tempo real um único documento.
- **`useMemoFirebase(factory, deps)`**: **USO OBRIGATÓRIO**. Envolve a criação de referências de consulta (`query()` ou `doc()`) para `useCollection` e `useDoc`. Isso evita recriações desnecessárias da consulta em cada renderização, o que causaria loops infinitos e erros de permissão.

## 3. Arquitetura de Componentes (React)

A interface é construída com componentes reutilizáveis e uma estrutura de abas.

### 3.1. Layout Principal

- `src/app/dashboard/layout.tsx`: Layout protegido que garante que apenas usuários logados acessem o dashboard.
- `src/components/dashboard/main-layout.tsx`: Define a estrutura visual com `Header`, `Sidebar` e `MobileTabBar`.

### 3.2. Abas do Dashboard

Cada aba principal é um componente que centraliza a lógica e a UI daquela seção.
- `overview-tab.tsx`: Painel principal com métricas e resumos.
- `costs-tab.tsx`: Gerenciamento de contas a pagar.
- `revenue-tab.tsx`: Gerenciamento de contas a receber.
- `projects-tab.tsx`: Listagem de todos os projetos.
- `cashflow-tab.tsx`: Visão consolidada do fluxo de caixa.
- `reports-tab.tsx`: Gráficos e relatórios.
- `settings-page.tsx`: Configurações de perfil e categorias.

### 3.3. Padrões de Componentes Reutilizáveis

- **Diálogos e Formulários**:
  - O padrão é ter um componente de **Diálogo** (ex: `ProjectDialog`) que controla o estado de abertura e o envio de dados.
  - O Diálogo renderiza um componente de **Formulário** (ex: `ProjectForm`) que contém a lógica do formulário (validação com Zod, campos, etc.).
  - A submissão do formulário chama uma função das `actions.ts`.
- **Gráficos (`src/components/charts/`)**:
  - Componentes de gráficos reutilizáveis (ex: `CostLineChart`) que recebem os dados (`costs`, `revenues`) como props e os processam para exibição.
- **Tabelas e Listas**:
  - Utilizam os componentes da ShadCN (`Table`, `Card`) para exibir listas de dados, com renderização condicional para mobile (cards) e desktop (tabelas).

## 4. IA com Genkit

- **Localização**: As lógicas de IA estão em `src/ai/flows/`.
- **Padrão**: Cada arquivo define um "flow" com `ai.defineFlow`, que pode usar um `ai.definePrompt`. O arquivo também exporta uma função wrapper assíncrona que executa o flow, além dos tipos de entrada e saída (schemas Zod).
- **Exemplo Existente**: `deviation-analysis-assistant.ts` analisa desvios de custos em projetos.

## 5. Boas Práticas e Pontos de Atenção

1.  **Segurança em Primeiro Lugar**: TODA consulta ao Firestore deve ser filtrada pelo `userId`. O erro `Missing or insufficient permissions` quase sempre indica uma consulta `collectionGroup` ou `collection` sem o filtro `where('userId', '==', user.uid)`.
2.  **Memoização é Obrigatória**: Sempre envolva a criação de `query()` ou `doc()` para os hooks `useCollection` e `useDoc` com `useMemoFirebase`. Não fazer isso resultará em loops de renderização e consultas excessivas.
3.  **Ações Centralizadas**: Não escreva lógica de `addDoc`, `updateDoc`, `setDoc` diretamente nos componentes. Use as funções pré-definidas em `src/lib/actions.ts`.
4.  **Datas**: Ao lidar com datas de formulários ou do Firestore, utilize as funções `parseLocalDate` ou `parseDateString` para evitar problemas de fuso horário (timezone).
5.  **Estado Reativo**: Prefira usar os dados reativos dos hooks `useCollection` e `useDoc`. Use `useMemo` para calcular valores derivados desses dados (como os resumos e métricas), garantindo que os cálculos só sejam refeitos quando os dados brutos mudarem.
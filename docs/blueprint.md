# **App Name**: Finestra Financials

## Core Features:

- Visão Geral do Projeto: Painel exibindo o nome do projeto, cliente (opcional), datas de início/fim, status (em andamento, concluído, cancelado), custo total previsto, receita total prevista, custo real total (calculado automaticamente), lucro (previsto e real).
- Gestão de Custos: Registrar custos previstos vs. reais para projetos, categorizar custos (mão de obra, materiais, etc.), gerenciar custos fixos recorrentes (aluguel, utilidades).
- Rastreamento de Receitas: Registrar receitas previstas vs. recebidas, gerenciar parcelamentos de pagamento, vincular a métodos de pagamento personalizáveis (dinheiro, cartão, transferência).
- Gestão de Fluxo de Caixa: Visão consolidada de entradas e saídas, filtrando por data, categoria, projeto e status.
- Geração de Relatórios Financeiros: Gerar automaticamente gráficos de pizza para mostrar a distribuição de custos e gráficos de barras mostrando comparações de previsões de receita.
- Painel de Métricas Chave: Painel exibe projetos ativos, lucro previsto vs. real, custos fixos mensais e receita pendente.
- Assistente de análise de desvio: Sinalizar automaticamente custos que se desviaram significativamente das previsões. O sistema atua como uma ferramenta sugerindo a variação com base em superavaliações relatadas anteriormente e motivos para a variação usando uma ferramenta LLM.
- Authentication: Use Firebase Authentication to manage user accounts.
- Database: Use Firestore as the primary datastore.

## Style Guidelines:

- Cor primária: Teal profundo (#008080) para uma sensação de confiança e confiabilidade financeira.
- Cor de fundo: Teal claro (#E0F8F7) para um ambiente calmo e profissional.
- Cor de destaque: Turquesa claro (#7DF9FF) para destacar ações e métricas importantes.
- Fonte do corpo e do título: 'Inter' para uma interface de usuário moderna, limpa e altamente legível.
- Use ícones consistentes e minimalistas representando transações financeiras e status do projeto.
- Um layout limpo e bem organizado, com seções claras para cada módulo, para promover o uso eficiente.
- Transições sutis ao navegar entre seções ou exibir dados atualizados.
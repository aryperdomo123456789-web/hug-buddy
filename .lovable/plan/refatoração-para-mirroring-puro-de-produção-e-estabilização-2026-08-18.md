# Refatoração para Mirroring Puro de Produção e Estabilização

Este plano visa reverter a aplicação para o estado de produção (conforme o repositório `bkproducao`), removendo as adições experimentais de "Dashboard" e "Gestão de Canais" que estão causando instabilidade, enquanto preserva e corrige o sistema de "Planos de Venda".

## Mudanças do Usuário

- Remover a aba "Dashboard" (Manter "Servidores" como visão principal se for o caso de produção, ou seguir o layout original).
- Remover a aba "Gestão de Canais".
- Restaurar o comportamento e navegação 100% fiel ao `bkproducao`.
- Corrigir bugs no sistema de Planos (Sincronização e Templates).
- Resolver erros de carregamento infinito/travamento em F5 (Estabilização do SSR/Hydration).

## Detalhes Técnicos

### 1. Reversão da Navegação (`src/routes/index.tsx`)
- Alterar `activeTab` inicial para "customers" (padrão de produção).
- Remover `dashboard` e `streams` do array `navItems`.
- Simplificar a renderização condicional para remover componentes não utilizados.

### 2. Estabilização de Dados (`src/hooks/use-odin.ts`)
- Otimizar o intervalo de polling para evitar "overload" do servidor Odin via SSH.
- Corrigir a lógica de `initialSnapshot` para garantir que o F5 carregue os dados instantaneamente sem "tela branca" ou erros de hidratação.

### 3. Correção do Sistema de Planos
- Garantir que `PlanList` e `PlanModal` carreguem corretamente os dados do Supabase.
- Corrigir a lógica de template no `CustomerList.tsx` para garantir que a herança (Template Global -> Template do Plano) funcione sem erros.

### 4. Limpeza de Código
- Remover importações de componentes removidos.
- Ajustar os cards de estatísticas para o topo da lista de clientes, se for esse o layout de produção.

## User-facing changes

- A aba Dashboard desaparecerá; o painel abrirá direto na Lista de Clientes.
- A aba Gestão de Canais será removida.
- O sistema de Planos será corrigido para salvar e aplicar templates corretamente.
- A navegação ficará mais fluida e sem erros ao recarregar a página.

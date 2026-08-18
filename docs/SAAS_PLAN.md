---
name: Mago Panel SaaS Transition
description: Plano para transformar o Mago Panel em um sistema SaaS com gestão de usuários e vínculo com revendedores Odin.
type: feature
---

> Regra de arquitetura: o Odin oficial permanece intocado. O Mago Panel é a camada SaaS, de leitura e provisionamento seguro.

# Plano de Implementação SaaS

## 1. Infraestrutura de Identidade (Supabase)
- **Tabela `profiles`**: Armazenar dados dos usuários do Mago Panel (SaaS).
  - `id` (uuid, fk para auth.users)
  - `role` (enum: 'admin', 'reseller')
  - `odin_reseller_id` (int, fk para a tabela `reg_users` do Odin - opcional para admins)
  - `full_name` (text)

## 2. Lógica de Acesso e Permissões (RLS)
- **Admin (Dono)**:
  - Acesso total: vê todos os clientes, todos os revendedores Odin.
  - Pode mover clientes entre revendedores (update `created_by` na tabela `users` do Odin).
- **Reseller (Comum)**:
  - Acesso restrito: vinculado a um `odin_reseller_id`.
  - Só vê clientes onde `created_by` == `odin_reseller_id`.
  - Ao criar clientes, `created_by` é forçado para o seu ID.

## 3. Refatoração do Backend (`server.functions.ts`)
- Injetar o contexto do usuário logado em todas as chamadas.
- Adicionar cláusulas `WHERE` dinâmicas baseadas no `role` e `odin_reseller_id` do perfil.
- Implementar a função de "Transferência de Cliente" entre revendedores.

## 4. Frontend e Gestão de Usuários
- **Aba "Usuários SaaS"**: Nova interface para gerenciar quem acessa o painel.
- **Vínculo**: No cadastro de usuário do painel, selecionar a qual revendedor Odin ele pertence.
- **Filtros Globais**: Garantir que o estado global (`useOdinData`) respeite o escopo do usuário logado.

## 5. Cronograma Sugerido
1. Configuração do esquema de banco no Supabase.
2. Implementação do Middleware de Autenticação.
3. Migração das Queries do Odin para suporte a Multi-Tenancy (Filtro por Revendedor).
4. Interface de Gestão de Usuários do Painel.

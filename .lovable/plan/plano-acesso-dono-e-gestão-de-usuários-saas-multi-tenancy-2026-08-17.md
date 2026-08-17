# Plano: Acesso Dono e Gestão de Usuários SaaS (Multi-tenancy)

Este plano detalha a implementação do usuário "Dono" (Admin) no Mago Panel, com privilégios totais e capacidade de gerenciar "Usuários Comuns" (Revendedores SaaS), vinculando-os a revendedores reais do Odin.

## 1. Banco de Dados e Segurança (Supabase)
- **Migração SQL:**
  - Garantir que o usuário `mago@dono.com` exista no `auth.users` e tenha o perfil correspondente na tabela `profiles` com `role = 'admin'`.
  - Impedir a exclusão de perfis com `role = 'admin'` via RLS ou Trigger.
  - Adicionar política RLS para que apenas administradores possam criar ou deletar outros perfis.

## 2. Lógica de Backend (Server Functions)
- **Refatoração de `src/lib/saas.functions.ts`:**
  - Criar `inviteSaasUser`: Função para criar um novo usuário no Supabase e seu respectivo perfil vinculado a um `odin_reseller_id`.
  - Criar `changeSaasPassword`: Função para permitir que o usuário logado altere sua própria senha (ou que o Admin altere de outros).
  - Reforçar que administradores (`role = 'admin'`) ignorem filtros de `reseller_id` em todas as consultas SQL do Odin.

## 3. Interface do Usuário (Frontend)
- **Gestão de Perfil:**
  - Adicionar uma seção de "Meu Perfil" ou estender a aba "Configuração Odin" para incluir "Alterar Senha".
- **Aba Usuários SaaS (`SaasUserList.tsx`):**
  - Implementar o formulário de convite/criação.
  - Permitir a seleção de um "Revendedor Odin" existente ao criar um usuário comum.
  - Listar usuários com seus respectivos papéis e revendas vinculadas.
- **Proteção do Dono:**
  - Ocultar botões de "Excluir" para o perfil do Dono na listagem.

## 4. Documentação
- **`docs/odin/CREDENCIAIS_ATIVAS.md`:**
  - Registrar formalmente as credenciais do Dono: `mago@dono.com` / `12345678`.

## Detalhes Técnicos
- **Porta:** 6328 (Painel).
- **Porta Odin:** 7999.
- **Auth:** Supabase Auth + `profiles` table.
- **Roles:** `admin` (Dono), `reseller` (Usuário Comum).
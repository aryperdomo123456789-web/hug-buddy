# Plano de Implementação: Mago Panel SaaS

Este plano detalha a transformação do painel em uma plataforma SaaS multi-tenancy, permitindo a criação de usuários com diferentes níveis de acesso vinculados ao Odin Streaming System.

## 1. Arquitetura de Usuários (SaaS)
O sistema deixará de ter uma conta única para usar o **Supabase Auth** como motor de identidade.

### Papéis (Roles)
- **Admin (Dono)**:
    - Visão global de todos os servidores e revendedores Odin.
    - Pode gerenciar (criar/editar/deletar) usuários SaaS do painel.
    - Pode transferir clientes entre diferentes revendedores Odin.
- **Reseller (Revendedor SaaS)**:
    - Vinculado a um `odin_reseller_id` específico.
    - Só visualiza clientes que pertencem a ele no Odin.
    - Cria novos clientes automaticamente associados ao seu ID de revendedor.

## 2. Implementação Técnica

### Fase 1: Banco de Dados e Segurança
- [x] **Migração de Perfis**: Criada a tabela `public.profiles` vinculada ao `auth.users`.
- [x] **Políticas de RLS**: Configuração de segurança para que revendedores não acessem perfis de outros.
- [x] **Fix de Segurança**: Revogação de execução pública da função `is_admin`.

### Fase 2: Backend e Multi-Tenancy
- [ ] **Middleware de Escopo**: Refatorar `server.functions.ts` para capturar o `odin_reseller_id` do usuário logado.
- [ ] **Queries Filtradas**: Adicionar `WHERE created_by = ?` em todas as listagens de clientes quando o usuário não for Admin.
- [ ] **Transposição de Comandos**: Garantir que o comando de "Kill" e "Delete" valide se o cliente pertence ao revendedor solicitante.

### Fase 3: Interface (UI/UX)
- [x] **Aba Usuários SaaS**: Estrutura inicial criada no menu lateral.
- [ ] **Tela de Vínculo**: Modal para criar usuários do painel e associá-los a uma revenda Odin existente.
- [ ] **Dashboard Resumido**: Visão de estatísticas filtrada para o revendedor (apenas seus créditos e clientes).

## 3. Segurança e Regras de Negócio
- Um revendedor **não pode** alterar seu próprio `odin_reseller_id`.
- Somente o Admin pode criar outros Admins.
- Toda ação no Odin será auditada pelo usuário SaaS que a realizou.

## 4. Próximos Passos Imediatos
1. Implementar a listagem real de usuários na nova aba "Usuários SaaS".
2. Criar o fluxo de "Sign Up" administrativo para novos revendedores.

# Plano de Implementação: Mago Panel SaaS & Espelhamento Real

Este plano detalha os passos para finalizar a transformação do Mago Panel em uma plataforma SaaS multi-tenancy com espelhamento em tempo real do Odin.

## 1. Segurança e Escopo do Backend
- [ ] Refatorar `src/lib/server.functions.ts` para validar permissões em todas as operações de escrita (CRUD).
- [ ] Garantir que um `reseller` só possa criar, editar ou excluir clientes vinculados ao seu `odin_reseller_id`.
- [ ] Impedir que um `reseller` veja ou modifique outros revendedores.

## 2. Gestão de Usuários SaaS (Supabase)
- [ ] Implementar `createSaasUser` em `src/lib/saas.functions.ts` usando `supabaseAdmin` para criar contas no Supabase Auth.
- [ ] Adicionar funcionalidade em `SaasUserList.tsx` para vincular usuários do painel a IDs de revendedores do Odin.
- [ ] Implementar exclusão de usuários SaaS (com proteção para o Dono).

## 3. Interface Multi-Tenancy
- [ ] Ajustar a sidebar em `src/routes/index.tsx` para ocultar abas administrativas (`Revendedores`, `Usuários SaaS`, `Configuração`) quando o usuário logado não for `admin`.
- [ ] Garantir que o Dashboard mostre apenas estatísticas do escopo do revendedor logado.

## 4. Estabilização e M3U
- [ ] Corrigir a lógica de geração de links M3U para usar o DNS configurado e a porta de streaming correta do Odin (7999 ou configurada).
- [ ] Validar a conexão SSH persistente para evitar timeouts em operações em lote.

## Detalhes Técnicos
- O banco Supabase (tabela `profiles`) será a fonte para autenticação e papéis.
- O banco MariaDB (Odin) será a fonte para dados de IPTV.
- A sincronia será feita via SSH Tunneling / MySQL Client direto.

# Plano de Sincronização e Upgrade - Mago Panel

Este plano detalha a sincronização das melhorias mais recentes do repositório de backup (`backup` branch), focando em gestão avançada de usuários, novos componentes de UI e estabilização das funções de servidor.

## Ações Realizadas

### 1. Núcleo de Configuração (`src/lib/odin.ts`)
- Sincronizar fallbacks e leitura de variáveis de ambiente.
- Garantir que `apiToken` e credenciais SSH/DB estejam centralizadas.

### 2. Funções de Servidor (`src/lib/server.functions.ts`)
- **Gestão de Usuários:** Adicionar `updateUser`, `toggleUserStatus` e `deleteUser` com suporte a campos avançados (notas, bouquets, restreamer, trava de IP).
- **Consultas Expandidas:** Atualizar `getUsers` para extrair todos os campos necessários para o novo editor.
- **Streams & Servidores:** Garantir que `getServers` e `getStreams` estejam operacionais e tipados.

### 3. Interface do Mago (`src/routes/index.tsx`)
- **Editor de Usuários:** Implementar o novo modal de edição com abas (Detalhes, Avançado, Restrições, Bouquets).
- **Dashboard:** Atualizar os cards de status e a tabela de usuários recentes com os novos campos.
- **Laboratório Legado:** Limpar referências e preparar para o espelhamento real.

## Detalhes Técnicos

- **SQL Dinâmico:** Uso de `escapeSql` em todas as inserções/atualizações via SSH.
- **Isolamento de Conexão:** Manter o padrão `withSsh` para evitar concorrência.
- **TanStack Start:** Utilizar `loader` para injetar configurações iniciais do Odin no componente.

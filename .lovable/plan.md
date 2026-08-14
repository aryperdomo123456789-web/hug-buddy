# Plano de Sincronização e Melhorias - Mago Panel

Este plano visa sincronizar as melhorias do repositório de backup e garantir que o Mago Panel reflita fielmente os dados do servidor Odin v6, corrigindo falhas de tipagem e integrando novas funcionalidades.

## Ações Realizadas

- Centralização da configuração em `src/lib/odin.ts`.
- Refatoração de `src/lib/server.functions.ts` para usar tipos explícitos e novos métodos de segurança (SSH/MySQL).
- Correção de erros de tipagem no carregamento de usuários.

## Próximos Passos

### 1. Sincronização de UI (src/routes/index.tsx)
- Integrar as abas de "Streams" (Canais) e "Servers" conforme mapeado no backup.
- Atualizar a tabela de clientes para suportar as colunas detalhadas do Odin (Reseller, Conexões reais).
- Adicionar feedbacks visuais de carregamento e erro mais robustos.

### 2. Expansão de Funcionalidades
- Implementar `getServers` e `getStreams` no frontend para visualização real do ecossistema Odin.
- Adicionar filtros por categoria de canais e status de servidor.

### 3. Documentação e Segurança
- Atualizar o guia de infraestrutura com os novos métodos de escape SQL e isolamento de conexão SSH.

## Detalhes Técnicos

- **Configuração:** `src/lib/odin.ts` gerencia variáveis de ambiente com fallbacks seguros.
- **Backend:** `createServerFn` com `withSsh` garante que cada requisição abra e feche sua própria conexão, evitando o erro "aborted".
- **Database:** Uso de `mysql --batch --raw` para parsing eficiente de tabelas via terminal SSH.

# Plano de Restauração e Expansão do Mago Panel

O Mago Panel foi simplificado demais em uma iteração anterior, perdendo abas essenciais como Dashboard (com estatísticas reais), Servidores e Streams, além de detalhes importantes na aba Clientes (conexões ativas). Vamos restaurar essas funcionalidades usando a infraestrutura SSH/MySQL já estabelecida.

## Ações Imediatas

- [ ] **Restaurar a Aba Dashboard**: Implementar os cards de estatísticas (Total Usuários, Online, Streams, Servidores) buscando dados reais do banco `xtream_iptvpro`.
- [ ] **Restaurar a Aba Servidores**: Exibir a lista de servidores de streaming (`streaming_servers`) com status e carga.
- [ ] **Restaurar a Aba Streams**: Exibir a lista de canais/streams com status online/offline.
- [ ] **Melhorar a Aba Clientes**: Incluir a coluna de "Conexões" (Cons. Ativas / Max) e permitir a edição completa dos parâmetros do Odin (Bouquets, Notas, etc).
- [ ] **Consolidar UI Underground**: Garantir que todas as abas sigam o padrão Zinc-950 com acentos em Azul.

## Detalhes Técnicos

- **API SSH/MySQL**: Utilizar `getServers` e `getStreams` já definidos em `server.functions.ts`.
- **Estado do React**: Gerenciar múltiplos estados de dados (`servers`, `streams`) e visualização no `Dashboard` component.
- **Segurança**: Manter as credenciais centralizadas em `odin.ts` e injetadas via variáveis de ambiente no servidor.
- **UX**: Adicionar feedbacks de carregamento (skeletons ou spinners) e toasts para todas as operações CRUD.

## Referência Odin v6

Tabelas a serem consultadas:
- `users`: Dados dos clientes.
- `user_activity_now`: Conexões em tempo real.
- `streaming_servers`: Estado dos servidores.
- `streams` & `streams_sys`: Estado dos canais.

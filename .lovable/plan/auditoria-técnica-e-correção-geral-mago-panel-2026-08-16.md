# Auditoria Técnica e Correção Geral - Mago Panel

Realização de uma auditoria técnica profunda no Mago Panel para identificar e corrigir bugs, falhas de lógica, problemas de integração e renderização, visando estabilidade e performance.

## 1. Frontend e Renderização (SSR/Hydration)
- **Problema**: Possíveis erros de hidratação (hydration mismatch) em componentes que usam dados dinâmicos do navegador.
- **Solução**: Garantir que componentes que acessam `window` ou `navigator` (como o comando de instalação) usem o hook `useHydrated` ou verificações robustas dentro de `useEffect`.
- **Arquivos**: `src/routes/index.tsx`.

## 2. Estabilidade de Conexão (SSH/Database)
- **Problema**: Erros de concorrência "aborted" no túnel SSH ao realizar múltiplas chamadas em paralelo no Dashboard.
- **Solução**:
    - Centralizar o gerenciamento de sessões SSH para evitar sobrecarga.
    - Implementar um sistema de fila ou cache curto para estatísticas do dashboard.
    - Garantir que `withSsh` em `src/lib/server.functions.ts` trate timeouts de forma mais resiliente.
- **Arquivos**: `src/lib/server.functions.ts`, `src/routes/index.tsx`.

## 3. Lógica de Banco de Dados (Odin v6)
- **Problema**: Inconsistências nas queries SQL devido a variações de esquema entre versões do Odin (ex: `user_activity_now`).
- **Solução**:
    - Refinar a query de `getUsers` para ser mais compatível com Odin v6.0.3.
    - Adicionar tratamento de erros detalhado para falhas de query MySQL via SSH.
- **Arquivos**: `src/lib/server.functions.ts`.

## 4. Segurança e API
- **Problema**: O instalador em `src/server.ts` está hardcoded, dificultando manutenção.
- **Solução**: Mover a lógica do script de instalação para uma função dedicada e compartilhada, garantindo que o token e a URL sejam consistentes em todo o sistema.
- **Arquivos**: `src/server.ts`, `src/lib/server.functions.ts`.

## 5. UI/UX e Feedback
- **Problema**: Falta de estados de "loading" granular e tratamento visual de erros de conexão SSH.
- **Solução**: Adicionar indicadores de status de conexão SSH em tempo real e melhorar as notificações do `sonner`.
- **Arquivos**: `src/routes/index.tsx`.

## Detalhes Técnicos
- **SSH**: Otimização do `readyTimeout` e `keepalive`.
- **React**: Uso de `useSuspenseQuery` onde apropriado para melhor integração com TanStack Router.
- **MySQL**: Garantir escape correto de strings em todas as operações de escrita.

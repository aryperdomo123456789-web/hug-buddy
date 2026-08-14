# Plano para Resolver Erro 'aborted' e Otimizar Conexões SSH

O erro `Error: aborted` ocorre quando múltiplas conexões SSH são abertas simultaneamente via `Promise.all` em `src/routes/index.tsx`, sobrecarregando o servidor Odin ou causando timeouts no TanStack Start.

## Alterações

### 1. Frontend: Otimização de Chamadas (`src/routes/index.tsx`)
- Substituir `Promise.all` por execuções sequenciais nos métodos `handleFetchDashboard` e `handleFetchUsers`.
- Adicionar tratamento de erro mais robusto para evitar que uma falha em uma aba derrube o painel inteiro.

### 2. Backend: Melhoria de Resiliência (`src/lib/server.functions.ts`)
- Ajustar `withSsh` para garantir que a conexão seja encerrada corretamente mesmo em casos de aborto.
- Aumentar o `readyTimeout` e adicionar logs internos (no servidor) para diagnóstico.

### 3. Estabilidade da Rota de API (`src/routes/api.public.install.tsx`)
- Garantir que a rota de API não dispare processos pesados que possam causar abortos durante o download do instalador.

## Detalhes Técnicos
- O erro `abortIncoming` no Node.js indica que o cliente (browser) ou o proxy do Vite cancelou a requisição. Isso acontece geralmente quando a resposta demora demais devido à latência do SSH.
- Ao rodar sequencialmente, reduzimos a pressão sobre a porta 22 do servidor remoto.

---
**Nota:** Não serão feitas mudanças visuais, apenas correções de infraestrutura para estabilidade.

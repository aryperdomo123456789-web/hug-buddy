# Plano de Estabilização e Correção da Tela Branca

O objetivo deste plano é resolver definitivamente o problema da "tela branca" reportado pelo usuário, que ocorre devido a falhas na hidratação do TanStack Start e timeouts excessivos na comunicação SSH durante o carregamento inicial.

## Problemas Identificados
1. **Hidratação Bloqueada**: A rota raiz (`/`) está esperando o loader carregar dados do SSH, mas se o SSH falhar ou demorar, o SSR falha e o cliente não hidrata corretamente, resultando em tela branca.
2. **Ciclo de Vida de Dados**: O loader atual da rota `/` retorna apenas configurações estáticas, mas o `useOdinData` tenta buscar tudo via SSH imediatamente após a hidratação, sobrecarregando o servidor.
3. **Concorrência SSH**: Chamadas simultâneas ao servidor Odin podem causar erros `aborted` ou travar o processo do servidor local.

## Ações

### 1. Robustez na Rota Raiz
- Modificar `src/routes/index.tsx` para garantir que a renderização nunca seja bloqueada por dados externos.
- Adicionar uma camada de `ClientOnly` ou garantir que o estado de carregamento inicial seja visível.

### 2. Otimização do Hook `useOdinData`
- Refatorar a busca inicial para ser progressiva.
- Garantir que erros de rede não quebrem a UI (Catch-all visual).

### 3. Ajuste de Infraestrutura SSH
- Aumentar o timeout de rede no `withSsh` e garantir que o `dispose` ocorra de forma segura.

### 4. Verificação de Integridade
- Rodar teste de renderização com Playwright para confirmar que a interface aparece após as correções.

## Detalhes Técnicos
- Mover a chamada de `fetchAll` para um gatilho manual ou delay maior no `useEffect`.
- Utilizar `Suspense` ou estados de carregamento atômicos para cada seção do painel.

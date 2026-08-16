# Plano de Auditoria Técnica e Correção Geral - Mago Panel

O objetivo é realizar uma auditoria profunda para identificar e corrigir falhas de estabilidade, performance e renderização, garantindo que o painel espelhe perfeitamente a funcionalidade do Odin v6.

## Problemas Identificados (Auditoria Preliminar)

1.  **Instabilidade SSH**: O erro "aborted" sugere que as conexões SSH estão sendo encerradas prematuramente ou que o pool de conexões não está sendo gerenciado corretamente sob carga.
2.  **Mismatches de Hidratação (SSR)**: O uso de `window.location.host` diretamente no JSX causa erros de renderização no servidor (500).
3.  **Performance de Queries**: As queries SQL em `getUsers` e `getStreams` não estão paginadas adequadamente e podem ser lentas em bancos grandes.
4.  **Feedback Visual**: A falta de feedback claro durante operações assíncronas longas (como comandos SSH) pode levar o usuário a clicar múltiplas vezes.

## Etapas de Implementação

### 1. Estabilização do Backend (SSH & API)
- Refatorar `withSsh` em `src/lib/server.functions.ts` para garantir que a conexão seja mantida aberta apenas o tempo necessário, com tratamento de erros robusto.
- Centralizar a lógica do instalador Bash para evitar inconsistências entre a API e a UI.
- Adicionar logs detalhados no servidor para facilitar o diagnóstico de falhas de conexão MariaDB.

### 2. Correção de Frontend & Hidratação
- Implementar o hook `useHydrated` em todos os pontos que dependem de APIs do navegador.
- Proteger o acesso ao `window.location` para garantir que o comando de instalação seja renderizado corretamente no cliente.

### 3. Melhoria na Gestão de Clientes
- Garantir que todas as colunas do Odin v6 sejam mapeadas corretamente (Bouquets, Expiração, Status).
- Adicionar validações de entrada no `createUser` e `updateUser` para evitar injeções SQL (reforçar o uso de `escapeSql`).

### 4. Auditoria Visual & UX
- Adicionar botões de sincronização manual com feedback de loading em todas as abas.
- Padronizar os ícones de carregamento e mensagens de erro (via `sonner`).

## Detalhes Técnicos

- **Tecnologia**: TanStack Start v1 (React 19), Node-SSH, MariaDB (remoto via SSH).
- **Segurança**: Uso de tokens de 32 caracteres para a API Mago e escape de strings SQL.
- **Resiliência**: Aumento do `readyTimeout` SSH para 30s e delay de flush em `dispose`.

---
*Este plano foca em correções estruturais para eliminar erros de runtime e preparar a base para novas funcionalidades.*

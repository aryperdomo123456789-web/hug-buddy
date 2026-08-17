# Refatoração Profunda: Mago Panel

## Objetivos
Refatorar a aplicação para melhorar a manutenibilidade, segurança e performance, seguindo princípios de Clean Code e TanStack Start.

## Ações

### 1. Camada de Dados e Tipagem (`src/types/odin.ts`)
- [ ] Centralizar todas as interfaces (Customer, Reseller, Server, Stream, Bouquet, Profile).
- [ ] Remover usos de `any`.

### 2. Lógica de Domínio Odin (`src/lib/odin.server.ts`)
- [ ] Mover `executeBatchQueries` e `executeQuery` para este arquivo.
- [ ] Criar funções específicas para cada operação de banco (ex: `findUsers`, `insertUser`, `updateUserStatus`).
- [ ] Melhorar o parsing de resultados do MySQL para ser mais resiliente.
- [ ] Isolar as queries SQL brutas.

### 3. Server Functions (`src/lib/server.functions.ts` & `src/lib/saas.functions.ts`)
- [ ] Tornar estes arquivos "thin wrappers" (apenas declaração da server function e chamada para a camada de serviço).
- [ ] Melhorar validadores com `zod`.
- [ ] Refinar o tratamento de erros para retornar códigos de status adequados.

### 4. Hooks Customizados (`src/hooks/use-odin.ts`)
- [ ] Refatorar para usar tipagem forte.
- [ ] Melhorar a lógica de polling e cache.
- [ ] Separar ações de dados em hooks menores se necessário.

### 5. Componentes e UI (`src/routes/index.tsx` & `src/components/*`)
- [ ] Refatorar a `DashboardPage` para usar sub-componentes menores.
- [ ] Melhorar a lógica de navegação.
- [ ] Substituir `window.confirm` por componentes de UI (shadcn `AlertDialog`).
- [ ] Garantir que o estado de carregamento seja consistente em toda a UI.

### 6. Limpeza Geral
- [ ] Remover imports não utilizados.
- [ ] Padronizar nomes de variáveis (ex: usar camelCase consistentemente).
- [ ] Adicionar JSDoc para funções complexas.

## Technical Details
- **SSH Persistence**: Manter a lógica de conexão persistente mas com melhor gestão de ciclo de vida.
- **SQL Injection**: Reforçar o `escapeSql` ou usar placeholders se possível via SSH (difícil com CLI, mas `escapeSql` atual é o mínimo).
- **TanStack Start**: Aproveitar melhor o `beforeLoad` e `loader` para dados iniciais.

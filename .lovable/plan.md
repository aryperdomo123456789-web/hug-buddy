# Plano de Estabilização e Funcionalidade Real: Mago Panel

O objetivo deste plano é resolver a falha de navegação (que impede a troca de abas), garantir que o espelhamento das colunas e ações de usuários seja 100% funcional (excluir, editar, kill) e estabilizar a comunicação SSH/MySQL com o servidor Odin.

## Problemas Identificados
1.  **Navegação Travada**: O clique no menu lateral não altera o estado `activeTab` ou a re-renderização está sendo bloqueada por algum erro de carregamento.
2.  **Dados Zerados**: O dashboard mostra 0 em tudo, indicando que o `fetchAll` ou as consultas SQL via SSH estão falhando ou não sendo disparadas corretamente.
3.  **Ações Incompletas**: As funções de Criar/Editar/Excluir usuários estão como placeholders.

## Ações Técnicas

### 1. Frontend: Correção de Navegação e Estado
- Ajustar `src/routes/index.tsx` para garantir que `activeTab` dispare a re-renderização.
- Adicionar logs de depuração visíveis no terminal do navegador para cada mudança de aba.
- Implementar um sistema de cache simples no `useOdinData` para evitar que cada clique de aba reinicie todo o processo de conexão SSH se os dados forem recentes.

### 2. Backend: Implementação Real de CRUD
- **Excluir Usuário**: SQL DELETE na tabela `users` via SSH.
- **Editar/Criar**: SQL INSERT/UPDATE com todos os campos (exp_date, bouquets, max_connections, etc).
- **Kill Connections**: SQL DELETE na tabela `user_activity_now` para o user_id específico.

### 3. Servidor: Otimização de Conexão
- Centralizar a instância da `NodeSSH` no `server.functions.ts` para evitar abrir múltiplas conexões paralelas que saturam o servidor SSH.
- Aumentar o timeout de resposta do MySQL para 30s.

### 4. Interface: Espelhamento Visual (Legado/Sigma)
- Garantir que a lista de usuários mostre: Username, Password, Expiração (formatada), Conexões Ativas e Status.

## Detalhes Técnicos
- **Consultas SQL**: Usar `-N -s` no MySQL para obter resultados puros em Tab-Separated.
- **Estabilidade**: Implementar `Promise.allSettled` no loop de fetch para que a falha de um item (ex: streams) não quebre os outros (ex: clientes).

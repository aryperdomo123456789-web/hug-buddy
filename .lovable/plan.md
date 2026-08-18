# Plano de Implementação: Gerador de Teste Rápido Aleatório

Implementar um gerador de credenciais numéricas aleatórias (6 dígitos) para a função de "Teste Rápido" quando um plano de teste é selecionado.

## Alterações Técnicas

### 1. Backend (`src/lib/server.functions.ts`)
- Modificar `quickCreateTestUser` para gerar `username` e `password` como strings numéricas de 6 dígitos aleatórios.
- Garantir que a lógica de criação no Odin suporte essas credenciais.

### 2. Frontend (`src/components/dashboard/PlanList.tsx`)
- Adicionar um botão "Gerar Teste Rápido" visível apenas em planos marcados como `is_trial`.
- Este botão chamará a função `quickCreateTestUser` e entregará o template de mensagem formatado (usando a lógica de herança de template já implementada).

### 3. Integração de Mensagens (`src/components/dashboard/CustomerList.tsx` ou similar)
- Reutilizar a lógica de processamento de template para exibir/copiar a mensagem imediatamente após a geração do teste rápido.

## Detalhes Adicionais
- O sistema deve validar se o plano é realmente de teste antes de permitir a geração rápida.
- A entrega do template deve incluir todas as variáveis dinâmicas (`{username}`, `{password}`, `{dns}`, etc.).

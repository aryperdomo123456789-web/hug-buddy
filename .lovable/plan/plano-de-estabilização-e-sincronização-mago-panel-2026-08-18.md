# Plano de Estabilização e Sincronização - Mago Panel

O objetivo é garantir que os dados reais do servidor Odin (23.158.72.30) sejam carregados corretamente no laboratório, eliminando o estado de "0 TOTAL" e os avisos de sincronização pendente.

## Melhorias Técnicas

### 1. Robustez na Camada de Dados (Backend)

- **Otimização do `executeBatchQueries**`: Refatorar o driver SSH em `src/lib/server.functions.ts` para garantir que a conexão seja reestabelecida em caso de falha silenciosa.
- **Mapeamento de Tabelas Odin v6**: Ajustar as queries SQL para refletir a estrutura exata do Odin v6.0.3 (colunas como `created_by` em vez de `reseller_id`).

### 2. Estabilização do Ciclo de Vida (Frontend)

- **Ajuste no Hook `useOdinData**`: Reduzir o intervalo de poll inicial para 10s e garantir que o estado de `loading` seja resetado corretamente mesmo em falhas de timeout.
- **Tratamento de Dados Vazios**: Adicionar um estado visual claro de "Tentando reconectar" em vez de apenas mostrar zeros.

### 3. Persistência de Configuração

- **Garantia de Credenciais**: Verificar se o arquivo `.odin-config.json` no laboratório contém as credenciais oficiais (`user_iptvpro`) para evitar fallback para root que pode falhar.

## Detalhes para o Usuário

O painel no laboratório está mostrando zeros porque a conexão SSH está enfrentando latência ou as credenciais persistidas foram resetadas. Vou forçar uma reinicialização limpa do driver de dados e ajustar a interface para carregar os 23 usuários que confirmei via terminal.  
  
  
remove A ABA **Servidores**

&nbsp;
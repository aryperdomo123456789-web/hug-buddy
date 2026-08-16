# Plano de Refatoração Especializada: Mago Panel (Odin v6)

O objetivo é realizar uma refatoração profunda na aba "Clientes", espelhando a lógica avançada e os fluxos solicitados (baseados na referência do repositório hug-buddy e capturas de tela do Odin), mantendo a estabilidade do sistema SSH/MariaDB e corrigindo inconsistências de dados.

## Alterações Técnicas

### 1. Refatoração da Camada de Dados (Backend)
- **Otimização de Queries**: Ajustar `getOdinFullData` em `src/lib/server.functions.ts` para capturar campos avançados (notas, ISP, conexões máximas, etc.) de forma eficiente.
- **Normalização de Bouquets**: Corrigir a leitura/escrita de arrays de bouquets (JSON/Serialized no Odin) para garantir sincronização perfeita.
- **Tratamento de ISP e Status**: Implementar lógica para identificar ISP e status de conexão real (online/offline/blocked) via MariaDB.

### 2. Aperfeiçoamento da Interface (Frontend)
- **Espelhamento do Modal de Usuário**: Refatorar `src/components/dashboard/UserModal.tsx` para incluir todas as abas funcionais:
    - **Detalhes**: Campos básicos e validação.
    - **Avançado**: Opções de Restreamer, ISP Lock e Expiração Proporcional.
    - **Restrições**: IPs e User-Agents permitidos.
    - **Bouquets**: Interface de seleção múltipla integrada aos dados do servidor.
- **Lista de Clientes Aprimorada**: Melhorar `src/components/dashboard/CustomerList.tsx` com colunas detalhadas de ISP, Expiração (formatação clara) e botões de ação contextuais.

### 3. Estabilidade e Performance
- **Persistência de Conexão**: Refinar o `executeBatchQueries` para evitar Timeouts durante a carga de grandes volumes de dados.
- **Feedback Visual**: Adicionar Skeleton Loaders e estados de erro específicos para cada aba, garantindo que o usuário saiba exatamente o que está acontecendo.

## Passos de Implementação

1.  **Atualização de Tipagem**: Expandir `src/types/odin.ts` para cobrir todos os campos do Odin v6.
2.  **Ajuste de Queries SQL**: Modificar `src/lib/server.functions.ts` para extrair os dados completos.
3.  **Reconstrução do Modal**: Atualizar a UI e lógica do `UserModal.tsx`.
4.  **Ajustes na Tabela**: Refinar colunas e ações no `CustomerList.tsx`.
5.  **Validação**: Testar fluxos de criação e edição via SSH para garantir que não haja perda de dados.

# Plano de Refatoração: Planos SaaS & Testes Rápidos (Espelho Odin v6)

Este plano visa sincronizar a lógica de "Planos" do Mago Panel com a estrutura real de "Packages" do Odin v6, permitindo a criação de usuários vinculados a planos específicos e um dashboard de "Testes Rápidos".

## 1. Mapeamento de Banco de Dados (Odin)
*   Identificar a estrutura da tabela `packages` no MariaDB do Odin.
*   Campos esperados: `id`, `package_name`, `is_trial`, `max_connections`, `official_duration`, `official_duration_in`, `trial_duration`, `trial_duration_in`, `groups`, `bouquets`, `can_gen_mag`, `can_gen_enigma`, `only_mag`, `only_enigma`, `lock_stb`, `is_restream`, `output_formats`.

## 2. Refatoração do Backend (TanStack Start)
*   **`odin.server.ts`**: Adicionar `packages` ao snapshot global e implementar `createOdinUserFromPlan`.
*   **`server.functions.ts`**: Expor funções para buscar pacotes Odin e criar usuários baseados em planos.
*   **`plans.functions.ts`**: Atualizar a lógica de salvamento para permitir vincular um Plano SaaS a um Pacote Odin.

## 3. Interface de Usuário (Frontend)
*   **Dashboard (Home)**: Adicionar uma seção de "Gerador de Teste Rápido" com botões para os planos marcados como `is_trial`.
*   **PlanModal**: Adicionar campos para espelhar as configurações do Odin (Conexões, Duração, Opções de Dispositivo, Acesso de Saída).
*   **UserModal**: Permitir selecionar um Plano ao criar um usuário, preenchendo automaticamente as configurações.
*   **PlanList**: Exibir badges informativos sobre o tipo de plano (Oficial vs Teste).

## 4. Detalhes Técnicos
*   **Tipos**: Atualizar `src/types/odin.ts` para incluir a interface `OdinPackage`.
*   **Segurança**: Garantir que revendedores só vejam planos permitidos pelo Admin.
*   **UX**: Feedback instantâneo ao gerar testes rápidos (Copiar link M3U automaticamente).

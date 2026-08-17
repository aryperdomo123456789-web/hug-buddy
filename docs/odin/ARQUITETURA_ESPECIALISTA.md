# Arquitetura e Estratégia Mago Panel SaaS (aaPanel Ready)

Este documento detalha a visão técnica e arquitetural para a transformação do Mago Panel em uma plataforma SaaS de alta performance, otimizada para implantação via aaPanel e espelhamento em tempo real do sistema Odin.

## 1. Visão Geral da Arquitetura

O sistema opera em uma arquitetura de "Duplo Banco", separando a inteligência de negócios do SaaS dos dados operacionais do motor de streaming.

### MariaDB (Fonte de Verdade Odin)
- **O que é:** O banco de dados original do servidor Odin (porta 7999).
- **Função:** Leitura e escrita em tempo real para:
  - Gestão de Clientes (tabela `users`).
  - Gestão de Revendedores (tabela `reg_users`).
  - Métricas de Conexão (tabela `user_activity_now`).
  - Monitoramento de Streams e Servidores.
- **Vantagem:** Evita a duplicação de dados sensíveis e garante que o que você vê no painel é exatamente o que está acontecendo no servidor.

### Supabase (Cérebro do SaaS)
- **O que é:** Banco de dados relacional (PostgreSQL) para gestão da plataforma.
- **Função:**
  - Autenticação e Perfis (Identidade própria do Mago Panel).
  - Gestão de Papéis (Admin vs. Reseller).
  - Vínculo `odin_reseller_id` (Mapeia qual usuário do painel comanda qual revendedor no Odin).
  - Auditoria e Configurações de DNS Personalizadas.

---

## 2. Modelo de Permissões (Roles)

### Usuário Dono (Admin)
- **Acesso:** `mago@dono.com`.
- **Poderes:**
  - Visão global de todos os servidores e revendas.
  - Criação e gestão de novos usuários do Mago Panel.
  - Capacidade de transferir clientes entre diferentes revendedores.
  - Proteção contra exclusão (Imutabilidade).

### Usuário Revendedor (Reseller)
- **Acesso:** Vinculado a um perfil no Supabase.
- **Restrições:**
  - Vê apenas dados onde `created_by` coincide com seu `odin_reseller_id`.
  - Gestão limitada ao seu próprio escopo.
  - Sem acesso às configurações globais do servidor ou outros revendedores.

---

## 3. Diretrizes para Deploy (aaPanel)

Para garantir estabilidade e performance, o deploy deve seguir rigorosamente as especificações:

### Infraestrutura
- **Porta Exclusiva:** `6328` (Identidade do Mago Panel).
- **Isolamento Nginx:** Um arquivo de configuração Nginx deve ser criado especificamente para este projeto. Não compartilhe a configuração com outros sites para evitar conflitos de headers e roteamento do TanStack Start.
- **Runtime:** Node.js v18+ ou v20+ gerenciado pelo Node Version Manager (NVM) do aaPanel.

### Segurança
- **Conexão MariaDB:** O acesso deve ser feito via túnel SSH ou IP autorizado na porta 7999.
- **Token de API:** Gerado e injetado via instalador automatizado para garantir que apenas o Mago Panel possa comandar o servidor Odin.

---

## 4. Estratégia de "Espelhamento Vivo"

Diferente de painéis tradicionais que apenas copiam dados, o Mago Panel funciona como uma **Lente de Controle**:
1. O usuário solicita uma ação (ex: Bloquear Cliente).
2. O Backend valida as permissões SaaS no Supabase.
3. Se autorizado, o comando SQL/SSH é disparado diretamente no motor Odin.
4. A interface reflete a mudança instantaneamente através da consulta direta ao MariaDB.

---

*Documento gerado para a transição SaaS do Mago Panel.*

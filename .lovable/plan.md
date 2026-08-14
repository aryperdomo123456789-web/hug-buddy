# Plano de Espelhamento de Funções - Mago Panel (Odin v6)

O objetivo é transformar a aba de Clientes em um espelho funcional do painel original do Odin v6, adicionando todas as colunas de dados e controles avançados identificados nos prints, mantendo a estética "underground" solicitada.

## 1. Expansão do Modelo de Dados (Backend)
- **Tabelas e Campos**: Atualizar `getUsers` em `src/lib/server.functions.ts` para capturar campos adicionais: `member_id` (Dono), `is_trial`, `is_restreamer`, `is_isplock`, `forced_country`, `allowed_ips`, `allowed_ua`, `admin_notes`, `reseller_notes`, e `bouquet`.
- **Relacionamentos**: Adicionar a busca de nomes de pacotes (Bouquets) para exibir na listagem ou edição.
- **Novas Funções**:
  - `toggleUserStatus`: Para ativar/desativar rápido.
  - `resetUserStats`: Limpar estatísticas do usuário.
  - `killUserConnections`: Derrubar conexões ativas via comando SSH/MySQL.

## 2. Refatoração da Interface de Clientes
- **Listagem de Usuários**:
  - Colunas: ID, Nome, Senha, Revendedor (Dono), Estado (Badge), Teste (Badge), Expiração, Dias Restantes, Conexões (Online/Max), Info (ISP/IP) e Ações.
  - Botões de Ação: Editar, Resetar Logs, Bloquear, Kill Connections, Download Playlist, Remover.
- **Filtros Avançados**: Adicionar busca por nome e filtro por estado (Ativo/Bloqueado/Teste).

## 3. Modal de Edição Multi-Abas
Transformar o modal simples em um sistema de abas seguindo o print original:
- **Detalhes**: Campos básicos (User, Pass, Dono, Conexões, Validade, Notas).
- **Avançado**: Toggles para Restreamer, Conta de Teste, ISP Lock, Seleção de Acesso (HLS/MPEGTS/RTMP).
- **Restrições**: IPs permitidos e User-Agents autorizados.
- **Bouquets**: Lista real de pacotes do servidor com checkbox para seleção múltipla.

## Detalhes Técnicos
- **SSH/MySQL**: Utilizar `node-ssh` para comandos de "Kill" que exigem interação direta com o sistema Odin.
- **Zod**: Atualizar validadores de entrada para suportar os novos campos avançados.
- **Estado Local**: Gerenciar o estado das abas do modal com `useState`.

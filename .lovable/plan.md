# Plano de Ataque: Laboratório de Gestão IPTV (Estilo Mago Dev)

Vou transformar esse app numa central de comando para o seu servidor Xtream. O foco é segurança, velocidade e aquele visual "dark underground" de quem domina o jogo.

## 🛠️ Arquitetura Técnica
1.  **Frontend (React/TanStack):** Interface moderna, sombria e responsiva para gerenciar usuários, linhas e monitorar o servidor.
2.  **Backend (TanStack Server Functions):** Comunicação direta com o servidor SSH/API via Lovable Cloud.
3.  **Integração de Segurança:** Sistema de tokens inspirado no Sigma, mas otimizado para a sua própria infra.

## 📝 Etapas de Implementação

### 1. Design do Dashboard (O Palácio do Mestre)
*   Criar uma interface com tema escuro (Dark Mode por padrão).
*   Widgets de status do servidor (CPU, RAM, Uptime).
*   Tabela de gerenciamento de usuários (Criar, Editar, Banir).

### 2. O Script de Instalação (A Chave da Fortaleza)
*   Desenvolver um script `.sh` customizado (baseado no Sigma) que o usuário roda no servidor para liberar o acesso ao painel.
*   Esse script vai configurar o ambiente e gerar o token de pareamento.

### 3. Conexão e API
*   Criar rotas de API para receber os dados do servidor.
*   Implementar comandos remotos via SSH/PHP (conforme o Xtream UI/NXT/StreamCreed usam).

### 4. Gestão de Usuários
*   Formulários para criação de linhas (mag, m3u, enigma2).
*   Painel de controle de expiração e pacotes.

## 🚀 Próximos Passos
Vou começar limpando a página inicial e montando a estrutura base do seu novo império digital. Preparado para o deploy?

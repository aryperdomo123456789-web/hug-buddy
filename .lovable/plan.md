# Plano de Transição para aaPanel e Espelhamento MariaDB Odin

Este plano detalha a transição do painel para um ambiente aaPanel e a configuração de um espelhamento real via conexão direta ao MariaDB do Odin Streaming System.

## Objetivos
1.  **aaPanel Ready**: Preparar o painel para rodar de forma independente em um servidor com aaPanel (Node.js).
2.  **Espelhamento MariaDB Real**: Garantir que o painel leia e escreva diretamente no banco `xtream_iptvpro` na porta 7999 do servidor Odin, eliminando a dependência exclusiva de scripts remotos lentos.
3.  **Performance**: Otimizar a ponte SSH para que a interface não trave durante as consultas ao MariaDB.

## Etapas Técnicas

### 1. Infraestrutura aaPanel
- O painel é uma aplicação **TanStack Start (Node.js)**. Ele pode ser instalado no aaPanel usando o "Node.js Version Manager".
- A comunicação com o servidor Odin (IP 23.158.72.30) continuará sendo feita via **SSH Tunnel** (que o painel já faz internamente) ou **Conexão Direta ao MySQL** (se a porta 7999 estiver aberta para o IP do aaPanel).

### 2. Melhoria no Motor de Espelhamento (Backend)
- Refinar a lógica em `src/lib/server.functions.ts` para garantir que as transações de CRUD (Criar/Editar usuário) reflitam instantaneamente no Odin.
- Implementar um sistema de "Heartbeat" para verificar se a conexão com o banco do Odin está ativa antes de cada operação.

### 3. Interface de Diagnóstico de Transição
- Adicionar uma ferramenta no Dashboard que gera o comando de deploy para o aaPanel.
- Criar um script `deploy.sh` que automatiza a instalação das dependências e o build no novo servidor.

## Por que aaPanel?
- **Isolamento**: Se o Odin carregar demais a CPU com streams, seu painel de controle no aaPanel continuará fluido.
- **Domínio SSL**: Facilidade para configurar HTTPS (Let's Encrypt) com um clique.
- **Segurança**: Firewall do aaPanel permite restringir quem acessa a interface administrativa.


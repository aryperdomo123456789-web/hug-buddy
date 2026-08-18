# Mago Panel 🧙‍♂️

Dashboard dark moderno para gestão de servidores IPTV (Odin/Xtream Codes). Construído para alta performance e isolamento total no aaPanel.

O desenho do projeto é de `control plane`:

- o Odin oficial continua intacto
- o Mago Panel espelha os dados e faz provisionamento com segurança
- a escrita sensível passa por token e autenticação própria

## 📚 Documentação Técnica

Toda a inteligência e mapeamento do projeto estão centralizados na pasta `docs/`:

- [**Arquitetura Especialista SaaS**](./docs/odin/ARQUITETURA_ESPECIALISTA.md) - Visão técnica da integração MariaDB + SaaS.
- [**Guia Especialista Odin**](./docs/odin/GUIA_ESPECIALISTA_ODIN.md) - Manual técnico profundo do sistema de streaming.
- [**Infraestrutura e Acesso**](./docs/odin/INFRAESTRUTURA.md) - Detalhes de conexão SSH, Banco de Dados e API.
- [**Dicionário MariaDB**](./docs/odin/MARIA_DB_ODIN) - Mapeamento de tabelas e campos do Odin v6.
- [**Lições do Espelhamento Odin**](./docs/odin/LEICOES_MIRROR_ODIN.md) - Post-mortem técnico do que quebrou e como evitar repetir.
- [**Arquitetura do Control Plane**](./docs/odin/ARQUITETURA_CONTROL_PLANE.md) - Regra de separação entre o Odin oficial e o Mago Panel.
- [**Producao Atual**](./docs/odin/PRODUCAO_ATUAL.md) - Mapa do que a URL `/` consome hoje, do source ao build.
- [**Integração Sigma API**](./docs/odin/SIGMA_INTEGRATION.md) - Como o painel conversa com o motor de streaming.

---

## 🚀 Aquecimento e Instalação (aaPanel)

Para uma performance profissional e segura, recomendamos rodar o **Mago Panel** em um servidor dedicado com **aaPanel**.

### Pré-requisitos
1. Servidor com **aaPanel** instalado (Ubuntu 20.04+ recomendado).
2. Plugin **Node.js Version Manager** instalado no painel.
3. Node.js v20 ou superior ativo.

### Passo a Passo de Deploy

1. **Clone o repositório** no diretório de sites do seu aaPanel.
2. **Execute o script de deploy automatizado**:
   ```bash
   chmod +x deploy-aapanel.sh
   ./deploy-aapanel.sh
   ```
3. **Configuração no aaPanel**:
   - Vá em **Website** -> **Node project**.
   - **Project Path**: O caminho onde você clonou o projeto.
   - **Run Command**: `bun run start` (ou `npm run start`).
   - **Porta Personalizada**: `6328` (Obrigatória).
   - **Nginx**: Crie um arquivo de configuração **exclusivo** para este projeto para evitar conflitos de rota.

### PM2 Opcional

Se preferir reinício rápido e controle direto, use o processo exclusivo do projeto:

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

Depois, o restart fica simples:

```bash
pm2 restart hug-buddy
```

### ⚠️ Notas Importantes
- **Porta 6328**: Certifique-se de liberar esta porta no Firewall do aaPanel e no Security Group do seu provedor de nuvem.
- **Nginx Exclusivo**: Não utilize a configuração padrão compartilhada; o Mago Panel utiliza roteamento avançado do TanStack Start que requer headers específicos.

---

## Desenvolvimento Local

```bash
npm install
npm run dev
```

Este projeto foi construído com [Lovable](https://lovable.dev).

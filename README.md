# Mago Panel 🧙‍♂️

Dashboard dark moderno para gestão de servidores IPTV (Odin/Xtream Codes). Construído para alta performance e isolamento total no aaPanel.

## 📚 Documentação Técnica

Toda a inteligência e mapeamento do projeto estão centralizados na pasta `docs/`:

- [**Guia Especialista Odin**](./docs/odin/GUIA_ESPECIALISTA_ODIN.md) - Manual técnico profundo do sistema de streaming.
- [**Infraestrutura e Acesso**](./docs/odin/INFRAESTRUTURA.md) - Detalhes de conexão SSH, Banco de Dados e API.
- [**Dicionário MariaDB**](./docs/odin/MARIA_DB_ODIN) - Mapeamento de tabelas e campos do Odin v6.
- [**Integração Sigma API**](./docs/odin/SIGMA_INTEGRATION.md) - Como o painel conversa com o motor de streaming.

---

## 🚀 Aquecimento e Instalação (aaPanel)

Para uma performance profissional e segura, recomendamos rodar o **Mago Panel** em um servidor dedicado com **aaPanel**.

### Pré-requisitos
1. Servidor com **aaPanel** instalado (Ubuntu 20.04+ recomendado).
2. Plugin **Node.js Version Manager** instalado no painel.
3. Node.js v18 ou v20 ativo.

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

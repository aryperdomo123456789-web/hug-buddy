# 🔐 Credenciais Ativas (Odin Engine)

> Documento de referência do **Mago Panel**.
> Dados validados por conexão SSH real em **18/08/2026** (status: ✅ ONLINE).

---

## 🖥️ Acesso SSH (Root)

| Campo | Valor |
| --- | --- |
| IP / Host | `23.158.72.30` |
| Porta | `22` |
| Usuário | `root` |
| Senha | `fontemain123333` |
| Sistema Operacional | Ubuntu 20.04.6 LTS |
| CPU | 16 vCPUs |
| Memória RAM | 63.724 MB (~62 GB) |
| Uptime na validação | 1 dia, 12 horas |

Teste rápido de conectividade:

```bash
ssh root@23.158.72.30
```

---

## 🗄️ Banco de Dados (MariaDB do Odin)

| Campo | Valor |
| --- | --- |
| Host (interno ao servidor) | `127.0.0.1` |
| Porta | `7999` (porta personalizada do Odin) |
| Nome do Banco | `xtream_iptvpro` |
| Usuário | `user_iptvpro` |
| Senha | `Y92RYuXHLP58AbOciQW` |
| Versão | `10.3.39-MariaDB-0ubuntu0.20.04.2-log` |
| Bind | `0.0.0.0:7999` (processo `mysqld`) |

Comando de teste (executado via SSH no servidor):

```bash
mysql -h 127.0.0.1 -P 7999 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -e "SELECT COUNT(*) FROM users"
```

### Fallback de emergência

Caso o usuário oficial falhe, o painel tenta automaticamente:

```bash
mysql -u root -p'fontemain123333' xtream_iptvpro
```

---

## 📊 Inventário Real do Servidor (validado)

| Recurso | Tabela | Total |
| --- | --- | --- |
| Clientes (linhas IPTV) | `users` | **23** |
| Revendedores | `reg_users` | **4** |
| Canais / Streams | `streams` | **1.612** |
| Bouquets | `bouquets` | **8** |
| Servidores de streaming | `streaming_servers` | **6** |

### Servidores de Streaming ativos

| ID | Nome | Status | Porta HTTP |
| --- | --- | --- | --- |
| 1 | Main Server | 🟢 Online | 80 |
| 2 | LB-187 | 🟢 Online | 80 |
| 3 | LB-75 | 🟢 Online | 80 |
| 10 | LB LIME | 🟢 Online | 80 |
| 12 | LB-74 | 🟢 Online | 80 |
| 13 | LB-149 | 🟢 Online | 80 |

---

## 🔑 Segurança da API do Mago Panel

| Campo | Valor |
| --- | --- |
| Token Atual | `p0P2pycjQooGKKO2fqdkIagwfNA03DFj` |
| Localização no Servidor | `/home/xtreamcodes/iptv_xtream_codes/mago-api/token.txt` |
| Endpoint do instalador | `/api/public/install` |

---

## 👤 Acesso ao Mago Panel (SaaS)

| Campo | Valor |
| --- | --- |
| Dono (Admin) | `mago@dono.com` |
| Senha Padrão | `12345678` |
| Privilégios | Acesso total: clientes, revendas, planos e configuração |
| Store local (laboratório) | `/tmp/mago-panel-auth.json` |

Perfis suportados: `admin` (vê tudo) e `reseller` (vê apenas a própria revenda,
filtrada por `users.created_by`).

---

## 🏗️ Produção (aaPanel)

| Campo | Valor |
| --- | --- |
| Porta do Painel | `6328` |
| Caminho do deploy | `/www/wwwroot/gerar.suafontee.com/hug-buddy` |
| Arquivo de config persistente | `<deploy>/.odin-config.json` |
| Config no laboratório | `./.odin-config.json` |

---

## 🧭 Mapa de colunas do Odin v6 (importante)

| Conceito | Coluna correta no Odin v6 |
| --- | --- |
| Dono do cliente | `users.created_by` (não `reseller_id`) |
| Conexões ao vivo | `user_activity_now` (não `container_id`) |
| Status da revenda | `reg_users.status` |
| Estado dos canais | `streams_sys.stream_status` / `bitrate` |

---

## 🔧 Variáveis de ambiente equivalentes

Estas variáveis sobrescrevem os valores padrão quando definidas no servidor:

```
ODIN_SSH_HOST=23.158.72.30
ODIN_SSH_PORT=22
ODIN_SSH_USERNAME=root
ODIN_SSH_PASSWORD=fontemain123333
ODIN_DB_HOST=127.0.0.1
ODIN_DB_PORT=7999
ODIN_DB_NAME=xtream_iptvpro
ODIN_DB_USERNAME=user_iptvpro
ODIN_DB_PASSWORD=Y92RYuXHLP58AbOciQW
ODIN_API_TOKEN=p0P2pycjQooGKKO2fqdkIagwfNA03DFj
```

---

*Nota: estas credenciais são injetadas automaticamente nas funções de backend
(`src/lib/odin.server.ts`) e no instalador remoto. Nunca exponha este arquivo
publicamente.*

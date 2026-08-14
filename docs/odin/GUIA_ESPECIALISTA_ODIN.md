# 🎓 GUIA COMPLETO DE ESPECIALIZAÇÃO EM ODIN

**Versão:** 2.0
**Sistema:** Odin Streaming System v6.0.3
**Banco:** MariaDB 10.3.39
**Autor:** Claude Sonnet 4.5 - Especialista Odin
**Data:** 18/12/2025

---

## 📚 ÍNDICE

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura e Componentes](#2-arquitetura-e-componentes)
3. [Banco de Dados - Deep Dive](#3-banco-de-dados-deep-dive)
4. [Gerenciamento de Usuários](#4-gerenciamento-de-usuários)
5. [Gerenciamento de Streams](#5-gerenciamento-de-streams)
6. [Load Balancers](#6-load-balancers)
7. [Backup e Recuperação](#7-backup-e-recuperação)
8. [Otimização e Performance](#8-otimização-e-performance)
9. [Segurança](#9-segurança)
10. [Troubleshooting](#10-troubleshooting)
11. [Comandos SQL Essenciais](#11-comandos-sql-essenciais)
12. [Scripts de Automação](#12-scripts-de-automação)

---

## 1. VISÃO GERAL DO SISTEMA

### O que é o Odin?

Odin é um sistema completo de **IPTV Streaming** baseado em:
- **Backend:** PHP + Python
- **Banco de Dados:** MariaDB
- **Streaming:** FFmpeg/FFprobe
- **Web Server:** Nginx
- **OS:** Ubuntu 18.04/20.04/22.04/24.04

### Componentes Principais

```
┌─────────────────────────────────────────────────────┐
│              ODIN STREAMING SYSTEM                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐      ┌──────────────┐           │
│  │  Main Server │◄────►│   MariaDB    │           │
│  │   (Master)   │      │  (Database)  │           │
│  └──────┬───────┘      └──────────────┘           │
│         │                                          │
│         │ Gerencia e Distribui                     │
│         │                                          │
│  ┌──────▼────────┬──────────────┬──────────────┐  │
│  │Load Balancer 1│Load Balancer 2│Load Balancer N│  │
│  └───────────────┴──────────────┴──────────────┘  │
│         │                │              │          │
│         └────────────────┴──────────────┘          │
│                      │                             │
│              ┌───────▼────────┐                    │
│              │    Clientes    │                    │
│              │  (Usuários)    │                    │
│              └────────────────┘                    │
└─────────────────────────────────────────────────────┘
```

### Versões e Atualizações

- **Versão Atual:** 6.0.3 (Dezembro 2025)
- **Próxima Versão:** 7.4 (Janeiro 2026)
- **Ferramenta:** OdinToolBox
- **Suporte:** Discord oficial

---

## 2. ARQUITETURA E COMPONENTES

### Estrutura de Diretórios

```
/home/xtreamcodes/
├── iptv_xtream_codes/
│   ├── adtools/
│   │   └── balancer/          # Configurações de balanceamento
│   ├── wwwdir/                # Arquivos web (painel)
│   │   └── configblock_odin.php  # Config anti-scanner
│   ├── start_services.sh      # Inicia serviços
│   └── nginx/
│       └── nginx.conf         # Configuração Nginx
├── backups/                   # Backups do sistema
└── logs/                      # Logs do sistema
```

### Portas Padrão

| Serviço | Porta Padrão | Porta SSL | Descrição |
|---------|--------------|-----------|-----------|
| Admin Panel | 25500 | 25501 | Painel de administração |
| Streaming | 25461 | 25462 | Porta de streaming |
| Database | 7999 | - | MariaDB |
| API | 25463 | 25464 | API Odin |
| SSH | 22 | - | Acesso SSH |

**⚠️ SEGURANÇA:** Sempre altere as portas padrão!

---

## 3. BANCO DE DADOS - DEEP DIVE

### Database: xtream_iptvpro

**Total de Tabelas:** 111
**Versão MariaDB:** 10.3.39

### 3.1 Tabelas por Categoria

#### 🔐 Sistema de Usuários (9 tabelas)

```sql
users                    -- 35 linhas    | Clientes finais
login_users              -- 2.614 linhas | Sessões de login
reg_users                -- 2 linhas     | Administradores/Resellers
users_telefone           -- 14.082       | Telefones cadastrados
_binstream_users         -- 1.343        | Usuários binstream
user_activity            -- 0            | Atividade de usuários
user_activity_now        -- 13.595       | Atividade em tempo real
user_output              -- 357.546      | Output de streaming
mag_devices              -- 84           | Dispositivos MAG
```

**Estrutura Crítica da Tabela `users`:**

```sql
DESCRIBE users;

-- Campos ESSENCIAIS:
id                   -- ID único do cliente
username             -- Login
password             -- Senha
member_id            -- ID do revendedor (0 = admin)
exp_date             -- Data de expiração (UNIX TIMESTAMP)
enabled              -- 1 = Ativo, 0 = Bloqueado
max_connections      -- Limite de telas simultâneas
admin_enabled        -- Ativado pelo admin
bouquet              -- IDs dos pacotes [1,5,10]
is_mag               -- 1 = Dispositivo MAG
is_e2                -- 1 = Enigma2
is_restreamer        -- 1 = Linha de retransmissão
allowed_ips          -- IPs permitidos (JSON)
allowed_ua           -- User Agents permitidos
is_isplock           -- 1 = Bloqueio de ISP ativo
force_server_id      -- Forçar Load Balancer específico
created_at           -- Data de criação (UNIX TIMESTAMP)
```

#### 📺 Sistema de Streaming (15 tabelas)

```sql
streams                  -- 2.183 linhas  | Canais cadastrados
streams_sys              -- 2.064 linhas  | Canais em execução
streams_options          -- 67.322 linhas | Opções de transcodificação
streams_arguments        -- 19 linhas     | Argumentos FFmpeg
stream_categories        -- 124 linhas    | Categorias
series                   -- 11 linhas     | Séries
series_episodes          -- 978 linhas    | Episódios
epg                      -- 3 linhas      | EPG (Guia de programação)
epg_data                 -- 526 linhas    | Dados do EPG
streams_types            -- 5 linhas      | Tipos (Live, Movie, Series)
streams_providers        -- 0 linhas      | Provedores
```

**Estrutura Crítica da Tabela `streams`:**

```sql
DESCRIBE streams;

-- Campos CRÍTICOS:
id                       -- ID do canal
stream_display_name      -- Nome exibido
stream_source            -- URL da fonte (m3u8, ts, etc)
type                     -- 1=Live, 2=Movie, 3=Series
category_id              -- Categoria
created_channel_location -- ID do servidor rodando
enable_transcode         -- 1 = FFmpeg ativo
transcode_profile_id     -- Perfil de transcodificação
direct_source            -- 1 = Direct (sem processar)
read_native              -- 1 = Modo nativo
custom_ffmpeg            -- Parâmetros FFmpeg customizados
probesize_ondemand       -- Tamanho do buffer (128000 padrão)
tv_archive_duration      -- Catchup/Timeshift (horas)
epg_id                   -- ID do EPG vinculado
auto_restart             -- Configurações de auto-restart
```

**Estrutura da Tabela `streams_sys` (Tempo Real):**

```sql
DESCRIBE streams_sys;

-- Campos de MONITORAMENTO:
server_stream_id         -- ID único da execução
stream_id                -- ID do canal
server_id                -- ID do Load Balancer rodando
pid                      -- Process ID no Linux
stream_status            -- Status (0=Off, 1=On)
stream_started           -- Timestamp de início
bitrate                  -- Taxa de bits atual
current_source           -- Fonte atual
stream_info              -- JSON com infos técnicas
monitor_pid              -- PID do monitor
on_demand                -- 1 = On demand (só inicia se alguém assiste)
```

#### ⚙️ Sistema de Servidores (2 tabelas)

```sql
streaming_servers        -- 7 linhas      | Main + Load Balancers
server_activity          -- 0 linhas      | Atividade dos servidores
```

**Estrutura da Tabela `streaming_servers`:**

```sql
id                       -- ID do servidor (773, 774, 781, 785, 786...)
server_name              -- Nome
server_ip                -- IP do servidor
server_port              -- Porta SSH
server_type              -- 0=Main, 1=LoadBalancer
status                   -- 1=Online, 0=Offline
total_clients            -- Total de clientes conectados
network_guaranteed_speed -- Velocidade garantida
```

#### 💰 Sistema de Pagamentos e Vendas (10 tabelas)

```sql
_packages                -- 100 linhas    | Pacotes à venda
_packages_credits        -- 110 linhas    | Créditos de pacotes
_orders                  -- 108 linhas    | Pedidos
_payment_config          -- 23 linhas     | Configuração de pagamento
_payment_status          -- 5 linhas      | Status de pagamento
_gateways                -- 5 linhas      | Gateways (PIX, MercadoPago)
credits_log              -- 985 linhas    | Log de créditos
invoice                  -- 0 linhas      | Faturas
```

#### 📱 Sistema de Aplicativos (4 tabelas)

```sql
_apps                    -- 15 linhas     | Aplicativos configurados
_configs                 -- 1.548 linhas  | Todas as configurações
_templates               -- 0 linhas      | Templates
_bot_messages            -- 217 linhas    | Mensagens do bot
_chatbot                 -- 34 linhas     | Configurações do chatbot
_bot_login               -- 8 linhas      | Logins do bot
```

#### 📊 Sistema de Logs (11 tabelas)

```sql
stream_logs              -- 19.659.310 ⚠️ | Logs de streaming (GIGANTE!)
panel_logs               -- 452.257 ⚠️    | Logs do painel
dashboard_statistics     -- 413.270 ⚠️    | Estatísticas
_logs                    -- 155.227       | Logs gerais
reg_userlog              -- 75.616        | Logs de registro
login_logs               -- 0             | Logs de login
client_logs              -- 0             | Logs de clientes
```

**⚠️ ALERTA:** As tabelas de logs crescem MUITO rápido!

---

## 4. GERENCIAMENTO DE USUÁRIOS

### 4.1 Criar Usuário

```sql
INSERT INTO users (
    username,
    password,
    member_id,
    exp_date,
    enabled,
    admin_enabled,
    max_connections,
    created_at,
    created_by,
    bouquet
) VALUES (
    'cliente123',                              -- username
    'senha123',                                -- password
    1,                                         -- member_id (1 = você)
    UNIX_TIMESTAMP('2026-01-18 23:59:59'),    -- vence em 1 mês
    1,                                         -- enabled
    1,                                         -- admin_enabled
    2,                                         -- 2 telas
    UNIX_TIMESTAMP(NOW()),                     -- criado agora
    1,                                         -- criado por você
    '[1,5,10]'                                 -- pacotes 1, 5 e 10
);
```

### 4.2 Consultar Usuários

```sql
-- Ver todos os usuários ativos
SELECT
    username,
    member_id AS 'Revendedor',
    FROM_UNIXTIME(exp_date) AS 'Vencimento',
    max_connections AS 'Telas',
    enabled,
    FROM_UNIXTIME(created_at) AS 'Criado em'
FROM users
WHERE enabled = 1
ORDER BY exp_date DESC;
```

```sql
-- Ver usuários que vencem nos próximos 7 dias
SELECT
    username,
    FROM_UNIXTIME(exp_date) AS 'Vence em',
    DATEDIFF(FROM_UNIXTIME(exp_date), NOW()) AS 'Dias restantes'
FROM users
WHERE exp_date > UNIX_TIMESTAMP(NOW())
  AND exp_date < UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 7 DAY))
ORDER BY exp_date ASC;
```

```sql
-- Ver usuários vencidos
SELECT
    username,
    FROM_UNIXTIME(exp_date) AS 'Venceu em',
    DATEDIFF(NOW(), FROM_UNIXTIME(exp_date)) AS 'Dias vencido'
FROM users
WHERE exp_date < UNIX_TIMESTAMP(NOW())
  AND exp_date IS NOT NULL
ORDER BY exp_date DESC;
```

### 4.3 Renovar Usuário

```sql
-- Renovar por 30 dias
UPDATE users
SET exp_date = UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(exp_date), INTERVAL 30 DAY))
WHERE username = 'cliente123';
```

```sql
-- Renovar por 30 dias A PARTIR DE HOJE (mesmo se já vencido)
UPDATE users
SET exp_date = UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 30 DAY))
WHERE username = 'cliente123';
```

### 4.4 Bloquear/Desbloquear Usuário

```sql
-- Bloquear
UPDATE users SET enabled = 0 WHERE username = 'cliente123';

-- Desbloquear
UPDATE users SET enabled = 1 WHERE username = 'cliente123';
```

### 4.5 Alterar Limite de Telas

```sql
UPDATE users
SET max_connections = 4
WHERE username = 'cliente123';
```

### 4.6 Ver Usuários Online AGORA

```sql
SELECT
    u.username,
    u.max_connections AS 'Limite',
    COUNT(DISTINCT uan.container_id) AS 'Conectado Agora',
    uan.user_ip AS 'IP',
    uan.isp AS 'Provedor'
FROM users u
LEFT JOIN user_activity_now uan ON u.id = uan.user_id
WHERE uan.user_id IS NOT NULL
GROUP BY u.id
ORDER BY u.username;
```

### 4.7 Kickar Usuário (Desconectar)

```sql
-- Remove todas as conexões ativas
DELETE FROM user_activity_now WHERE user_id = (SELECT id FROM users WHERE username = 'cliente123');
```

---

## 5. GERENCIAMENTO DE STREAMS

### 5.1 Ver Canais Cadastrados

```sql
SELECT
    s.id,
    s.stream_display_name AS 'Nome',
    st.type_name AS 'Tipo',
    sc.category_name AS 'Categoria',
    CASE WHEN sys.stream_id IS NOT NULL THEN 'ONLINE' ELSE 'OFFLINE' END AS 'Status'
FROM streams s
LEFT JOIN streams_types st ON s.type = st.type_id
LEFT JOIN stream_categories sc ON s.category_id = sc.id
LEFT JOIN streams_sys sys ON s.id = sys.stream_id
WHERE s.type = 1  -- Live TV
ORDER BY s.stream_display_name;
```

### 5.2 Ver Canais Online Agora

```sql
SELECT
    sys.server_id AS 'Servidor',
    s.stream_display_name AS 'Canal',
    sys.bitrate AS 'Bitrate',
    FROM_UNIXTIME(sys.stream_started) AS 'Iniciado em',
    TIMESTAMPDIFF(HOUR, FROM_UNIXTIME(sys.stream_started), NOW()) AS 'Horas ON'
FROM streams_sys sys
JOIN streams s ON sys.stream_id = s.id
ORDER BY sys.server_id, s.stream_display_name;
```

### 5.3 Ver Distribuição de Canais por Servidor

```sql
SELECT
    server_id AS 'ID Servidor',
    COUNT(*) AS 'Canais Online'
FROM streams_sys
GROUP BY server_id
ORDER BY server_id;
```

### 5.4 Reiniciar Canal (Via SQL)

```sql
-- Marca o canal para ser reiniciado
DELETE FROM streams_sys WHERE stream_id = 123;
```

**⚠️ NOTA:** O Odin vai reiniciar automaticamente em alguns segundos.

### 5.5 Ver Top 10 Canais Mais Assistidos

```sql
SELECT
    s.stream_display_name AS 'Canal',
    COUNT(*) AS 'Total Conexões'
FROM stream_logs sl
JOIN streams s ON sl.stream_id = s.id
WHERE sl.date > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 24 HOUR))
GROUP BY s.id
ORDER BY COUNT(*) DESC
LIMIT 10;
```

---

## 6. LOAD BALANCERS

### 6.1 Ver Servidores

```sql
SELECT
    id,
    server_name AS 'Nome',
    server_ip AS 'IP',
    CASE server_type
        WHEN 0 THEN 'MAIN'
        WHEN 1 THEN 'LOAD BALANCER'
    END AS 'Tipo',
    CASE status
        WHEN 1 THEN 'ONLINE'
        ELSE 'OFFLINE'
    END AS 'Status',
    total_clients AS 'Clientes'
FROM streaming_servers
ORDER BY server_type, id;
```

### 6.2 Ver Carga de Cada Servidor

```sql
SELECT
    ss.id AS 'ID',
    ss.server_name AS 'Servidor',
    ss.total_clients AS 'Clientes Total',
    COUNT(sys.stream_id) AS 'Canais Rodando',
    ROUND(AVG(sys.bitrate) / 1000, 2) AS 'Bitrate Médio (Mbps)'
FROM streaming_servers ss
LEFT JOIN streams_sys sys ON ss.id = sys.server_id
WHERE ss.server_type = 1  -- Load Balancers
GROUP BY ss.id
ORDER BY ss.id;
```

### 6.3 Forçar Cliente em Load Balancer Específico

```sql
-- Forçar cliente no servidor ID 785
UPDATE users
SET force_server_id = 785
WHERE username = 'cliente123';

-- Remover força (balanceamento automático)
UPDATE users
SET force_server_id = 0
WHERE username = 'cliente123';
```

---

## 7. BACKUP E RECUPERAÇÃO

### 7.1 Backup Manual Completo

```bash
# Via SSH no servidor
mysqldump -u user_iptvpro -p \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    xtream_iptvpro | gzip > backup-$(date +%Y%m%d).sql.gz
```

### 7.2 Backup Sem Logs (Recomendado)

```bash
# Exclui tabelas gigantes de logs
mysqldump -u user_iptvpro -p \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --ignore-table=xtream_iptvpro.stream_logs \
    --ignore-table=xtream_iptvpro.panel_logs \
    --ignore-table=xtream_iptvpro.dashboard_statistics \
    xtream_iptvpro | gzip > backup-clean-$(date +%Y%m%d).sql.gz
```

### 7.3 Restaurar Backup

```bash
# Descompactar e restaurar
gunzip < backup-20251218.sql.gz | mysql -u user_iptvpro -p xtream_iptvpro
```

### 7.4 Backup Apenas de Clientes

```bash
mysqldump -u user_iptvpro -p \
    --no-create-info \
    xtream_iptvpro \
    users \
    login_users \
    mag_devices \
    users_telefone > backup-clientes-$(date +%Y%m%d).sql
```

---

## 8. OTIMIZAÇÃO E PERFORMANCE

### 8.1 Limpar Logs Antigos

```sql
-- Limpar logs com mais de 30 dias
DELETE FROM stream_logs
WHERE date < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY));

DELETE FROM panel_logs
WHERE date < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY));

DELETE FROM dashboard_statistics
WHERE dateadded < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY));

-- Otimizar tabelas após deletar
OPTIMIZE TABLE stream_logs;
OPTIMIZE TABLE panel_logs;
OPTIMIZE TABLE dashboard_statistics;
```

### 8.2 Ver Tamanho das Tabelas

```sql
SELECT
    TABLE_NAME AS 'Tabela',
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Tamanho (MB)',
    TABLE_ROWS AS 'Linhas'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'xtream_iptvpro'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
LIMIT 20;
```

### 8.3 Verificar Queries Lentas

```sql
-- Ver queries rodando agora
SHOW FULL PROCESSLIST;

-- Matar query específica
KILL 12345;  -- substitua pelo ID da query
```

### 8.4 Otimizar Todas as Tabelas

```bash
# Via SSH
mysqlcheck -u user_iptvpro -p --optimize xtream_iptvpro
```

---

## 9. SEGURANÇA

### 9.1 Alterar Portas Padrão

```bash
# Editar configuração Nginx
nano /home/xtreamcodes/iptv_xtream_codes/nginx/nginx.conf

# Alterar:
listen 25500;  # Para outra porta
listen 25461;  # Para outra porta
```

### 9.2 Habilitar Basic Auth no Nginx

```bash
# Via OdinToolBox
./OdinTB
# Opção: Habilitar Nginx Basic Authentication
```

### 9.3 Ver IPs Bloqueados

```sql
SELECT
    ip,
    FROM_UNIXTIME(date) AS 'Bloqueado em',
    attempts AS 'Tentativas'
FROM blocked_ips
ORDER BY date DESC
LIMIT 100;
```

### 9.4 Desbloquear IP

```sql
DELETE FROM blocked_ips WHERE ip = '192.168.1.100';
```

### 9.5 Ver Tentativas de Flood

```sql
SELECT
    user_id,
    user_ip,
    COUNT(*) AS 'Tentativas'
FROM login_flood
WHERE date > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 HOUR))
GROUP BY user_ip
ORDER BY COUNT(*) DESC;
```

### 9.6 Configurar Anti-Scanner

```bash
# Editar arquivo de configuração
nano /home/xtreamcodes/iptv_xtream_codes/wwwdir/configblock_odin.php

# Ajustar limites:
$max_attempts = 10;  # Máximo de tentativas
$block_time = 3600;  # Tempo de bloqueio (segundos)
```

---

## 10. TROUBLESHOOTING

### 10.1 Serviços Não Iniciam

```bash
# Verificar status
systemctl status nginx
systemctl status mariadb

# Iniciar serviços Odin
/home/xtreamcodes/iptv_xtream_codes/start_services.sh

# Ver logs de erro
tail -100 /home/xtreamcodes/iptv_xtream_codes/logs/errors.log
```

### 10.2 Erro: CURL_OPENSSL_3

```bash
# Executar no OdinToolBox
./OdinTB
# Opção [50] → [09] FIX: CURL_OPENSSL_3

# Reiniciar serviços
/home/xtreamcodes/iptv_xtream_codes/start_services.sh
```

### 10.3 Canais Não Abrem

```sql
-- Verificar se o canal está online
SELECT * FROM streams_sys WHERE stream_id = 123;

-- Ver últimos erros do canal
SELECT * FROM stream_logs
WHERE stream_id = 123
ORDER BY id DESC
LIMIT 10;

-- Reiniciar canal
DELETE FROM streams_sys WHERE stream_id = 123;
```

### 10.4 Load Balancer Offline

```sql
-- Verificar status
SELECT * FROM streaming_servers WHERE id = 785;

-- Forçar online (temporário)
UPDATE streaming_servers SET status = 1 WHERE id = 785;
```

```bash
# Via SSH no Load Balancer
/home/xtreamcodes/iptv_xtream_codes/start_services.sh
```

### 10.5 Banco de Dados Lento

```sql
-- Ver tabelas fragmentadas
SELECT
    TABLE_NAME,
    ROUND(DATA_LENGTH/1024/1024, 2) AS 'Data (MB)',
    ROUND(DATA_FREE/1024/1024, 2) AS 'Free (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'xtream_iptvpro'
  AND DATA_FREE > 0
ORDER BY DATA_FREE DESC;

-- Otimizar
OPTIMIZE TABLE stream_logs;
OPTIMIZE TABLE panel_logs;
```

---

## 11. COMANDOS SQL ESSENCIAIS

### 11.1 Estatísticas Gerais

```sql
-- Total de clientes
SELECT COUNT(*) AS 'Total Clientes' FROM users;

-- Clientes ativos
SELECT COUNT(*) AS 'Ativos' FROM users WHERE enabled = 1;

-- Clientes online agora
SELECT COUNT(DISTINCT user_id) AS 'Online Agora' FROM user_activity_now;

-- Total de canais
SELECT COUNT(*) AS 'Total Canais' FROM streams WHERE type = 1;

-- Canais online
SELECT COUNT(*) AS 'Canais Online' FROM streams_sys;

-- Espaço usado no banco
SELECT
    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Tamanho Total (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'xtream_iptvpro';
```

### 11.2 Relatório Completo de Sistema

```sql
SELECT
    'Clientes Totais' AS 'Métrica',
    COUNT(*) AS 'Valor'
FROM users
UNION ALL
SELECT 'Clientes Ativos', COUNT(*) FROM users WHERE enabled = 1
UNION ALL
SELECT 'Clientes Online', COUNT(DISTINCT user_id) FROM user_activity_now
UNION ALL
SELECT 'Canais Cadastrados', COUNT(*) FROM streams
UNION ALL
SELECT 'Canais Online', COUNT(*) FROM streams_sys
UNION ALL
SELECT 'Servidores Total', COUNT(*) FROM streaming_servers
UNION ALL
SELECT 'Servidores Online', COUNT(*) FROM streaming_servers WHERE status = 1;
```

---

## 12. SCRIPTS DE AUTOMAÇÃO

### 12.1 Renovação Automática

```bash
#!/bin/bash
# renova_clientes.sh

mysql -u user_iptvpro -p'SENHA' xtream_iptvpro <<EOF
-- Renovar todos os clientes que vencem hoje
UPDATE users
SET exp_date = UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(exp_date), INTERVAL 30 DAY))
WHERE DATE(FROM_UNIXTIME(exp_date)) = CURDATE()
  AND enabled = 1;

-- Log
INSERT INTO _logs (message, created_at)
VALUES ('Renovação automática executada', UNIX_TIMESTAMP(NOW()));
EOF

echo "Renovação concluída"
```

### 12.2 Limpeza Automática de Logs

```bash
#!/bin/bash
# limpa_logs.sh

mysql -u user_iptvpro -p'SENHA' xtream_iptvpro <<EOF
DELETE FROM stream_logs WHERE date < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));
DELETE FROM panel_logs WHERE date < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));
OPTIMIZE TABLE stream_logs;
OPTIMIZE TABLE panel_logs;
EOF

echo "Logs limpos"
```

### 12.3 Monitoramento de Servidores

```bash
#!/bin/bash
# monitor_servidores.sh

mysql -u user_iptvpro -p'SENHA' -N -e "
SELECT
    CONCAT(server_name, ' (ID ', id, ')'),
    CASE status WHEN 1 THEN 'ONLINE' ELSE 'OFFLINE' END
FROM xtream_iptvpro.streaming_servers
WHERE server_type = 1
ORDER BY id
"
```

### 12.4 Alerta de Clientes Vencendo

```bash
#!/bin/bash
# alerta_vencimento.sh

mysql -u user_iptvpro -p'SENHA' -N xtream_iptvpro <<EOF
SELECT
    username,
    FROM_UNIXTIME(exp_date),
    DATEDIFF(FROM_UNIXTIME(exp_date), NOW())
FROM users
WHERE exp_date > UNIX_TIMESTAMP(NOW())
  AND exp_date < UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 3 DAY))
ORDER BY exp_date;
EOF
```

---

## 📚 RECURSOS ADICIONAIS

### Documentação Oficial
- **Discord:** https://discord.gg/mH6D7VWXmt
- **Arquivo:** ODIN TOOLBOX DOCUMENTATION
- **Versão:** 6.0.3

### OdinToolBox - Principais Opções

```
[10] - Clean Install Main (Ubuntu 20.04)
[15] - Clean Install LoadBalancer (Ubuntu 20.04)
[40] - Update Your Panel
[45] - Security Updates
[50] - OdinToolBox Fix Issues
[70] - Update and Sanitize Database
[80] - Update FFmpeg/FFprobe
```

### Comandos Rápidos SSH

```bash
# Ver versão Odin
cat /home/xtreamcodes/iptv_xtream_codes/status

# Ver processos Odin
ps aux | grep xtream

# Reiniciar serviços
/home/xtreamcodes/iptv_xtream_codes/start_services.sh

# Ver porta MySQL
netstat -tlnp | grep 7999

# Ver uso de disco
df -h
du -sh /home/xtreamcodes/*

# Ver memória
free -h

# Ver load do sistema
uptime
```

---

## 🎯 CHECKLIST DO ESPECIALISTA

### Diário
- [ ] Verificar clientes online
- [ ] Verificar canais offline
- [ ] Ver logs de erro
- [ ] Monitorar uso de disco

### Semanal
- [ ] Backup completo do banco
- [ ] Limpar logs antigos
- [ ] Verificar updates disponíveis
- [ ] Revisar IPs bloqueados

### Mensal
- [ ] Otimizar todas as tabelas
- [ ] Revisar performance dos servidores
- [ ] Atualizar FFmpeg
- [ ] Testar restore de backup

### Trimestral
- [ ] Atualizar Odin (se disponível)
- [ ] Revisar segurança (portas, SSL)
- [ ] Limpar usuários inativos
- [ ] Documentar mudanças

---

**FIM DO GUIA**

🎓 **Você agora é um Especialista em Odin!**

Para dúvidas, consulte:
- Este guia
- Arquivo: ANALISE_COMPLETA_BACKUPS.md
- Arquivo: BACKUP_OTIMIZADO_ODIN.sh
- Discord oficial do Odin

**Bons streams! 📺**

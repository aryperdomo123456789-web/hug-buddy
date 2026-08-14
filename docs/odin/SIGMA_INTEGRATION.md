# Documentação Técnica: Integração Sigma API & Odin v6

## 1. Visão Geral
A API do Sigma (QPanel API) é uma interface PHP baseada no ORM RedBeanPHP (`rb.php`). Ela permite acesso direto às tabelas do banco de dados `xtream_iptvpro` via parâmetros de URL.

## 2. Instalação e Estrutura
- **Diretório:** `/home/xtreamcodes/iptv_xtream_codes/wwwdir/qpanel-api/`
- **Configuração de Banco:** Armazenada em `dbconfig.php` (criptografada com a chave `5709650b0d7806074842c6de575025b1`).

## 3. Endpoints e Parâmetros (Testados)

### Consulta Geral de Versão
- `GET /qpanel-api/?action=version`
- Retorna: `{"result":{"version":"1.0.17","script":"xtreamui",...}}`

### Consulta Genérica de Tabelas (CRUD Dinâmico)
A API utiliza um sistema de roteamento genérico para qualquer tabela do banco:

| Ação | Sub-ação | Parâmetros Extras | Descrição |
| :--- | :--- | :--- | :--- |
| `table` | `select` | `name`, `limit`, `offset` | Lista registros de uma tabela (ex: `name=users`) |
| `table` | `insert` | `name` + campos via `POST` | Cria um novo registro |
| `table` | `update` | `name`, `id` + campos via `POST` | Atualiza um registro existente |
| `table` | `delete` | `name`, `id` | Remove um registro |
| `table` | `schema` | `name` | Retorna a estrutura (colunas) da tabela |

### Ações Específicas
- `?action=packages`: Lista todos os pacotes (tabela `packages`).
- `?action=live_connections`: Lista conexões ativas com join em `users` e `streams`.
- `?action=user_activity_now`: Dump bruto da tabela de atividades.

## 4. Segurança e Autenticação
- **Token:** Passado via `?token=...` ou `$_POST['token']`.
- **Validação:** O token deve ser idêntico ao definido em `token.php`.
- **Logs:** A API registra operações em `/logs/` e na tabela `reg_userlog` com o prefixo `[SIGMA API->...]`.

## 5. Exemplo de Chamada via Terminal
```bash
curl -s "http://23.158.72.30/qpanel-api/?action=table&sub=select&name=users&token=vPFQcdEVBEw0v7id6XzXFeJ6nuLvMjA9&limit=5"
```

Esta documentação foi gerada após análise do código fonte (`index.php`) e testes de conectividade no laboratório.

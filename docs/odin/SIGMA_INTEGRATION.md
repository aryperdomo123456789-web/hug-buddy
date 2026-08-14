# Documentação Técnica: Integração Sigma API & Odin v6

## 1. Visão Geral
A API do Sigma (QPanel API) é uma interface PHP que atua como uma ponte entre o painel de gerenciamento e o banco de dados do servidor (Xtream UI, Odin, Streamcreed). Ela permite operações CRUD em usuários, monitoramento de streams e gestão de pacotes.

## 2. Instalação e Estrutura
O script de instalação automatizado realiza as seguintes ações:
- **Diretório:** `/home/xtreamcodes/iptv_xtream_codes/wwwdir/qpanel-api/`
- **Arquivos Principais:**
  - `index.php`: Ponto de entrada (router).
  - `functions.php`: Lógica de negócio e queries SQL.
  - `token.php`: Armazena o token de segurança `$token`.
  - `dbconfig.php`: Configurações de acesso ao banco de dados.

## 3. Endpoints Identificados
Com base na análise do instalador e testes de rede, a API suporta os seguintes parâmetros via `GET`:

| Ação | Descrição | Requer Token? |
| :--- | :--- | :--- |
| `?action=version` | Retorna versão da API e tipo de script. | Não |
| `?action=get_users` | Lista todos os usuários do banco. | Sim |
| `?action=get_streams` | Lista status das streams. | Sim |
| `?action=get_bouquets` | Lista pacotes disponíveis. | Sim |

## 4. Segurança
A API utiliza um token fixo de 32 caracteres gerado aleatoriamente durante a instalação.
- **Cabeçalho/Parâmetro:** `token=vPFQcdEVBEw0v7id6XzXFeJ6nuLvMjA9`

## 5. Próximos Passos para o Mago Panel
Para espelhar perfeitamente o comportamento do Sigma:
1. **Sincronização de Bouquets:** Usar a query mapeada para popular o grid de pacotes.
2. **Logs de Atividade:** Mapear o diretório `logs/` criado pelo instalador para depuração remota via painel.
3. **Gestão de Token:** Adicionar funcionalidade para rotacionar o token diretamente via SSH no arquivo `token.php`.

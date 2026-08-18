# Lições do Espelhamento do Odin

Este documento registra o que deu errado durante a recuperação do Odin e quais regras devemos seguir para não quebrar o ambiente de novo.

## Contexto

O objetivo é manter:

- o painel Mago funcionando no aaPanel
- o Odin principal online
- um MariaDB local espelhado em tempo real para leitura, análise e contingência
- os LBs e servidores legados sem alterar fluxos que já estão saudáveis

## O que deu errado

### 1. Confundimos o banco local com o banco principal

Em alguns momentos, a correção foi feita olhando apenas para o `config.ini` ou para o serviço local do laboratório.

O Odin real usa o arquivo criptografado:

- `/home/xtreamcodes/iptv_xtream_codes/config`

E não apenas o `config.ini`.

Conclusão:

- alterar só o `config.ini` não basta
- a validação precisa sempre confirmar o `config` criptografado, o `start_services.sh` e o `system_api.php`

### 2. Assumimos que o ambiente de CLI era igual ao ambiente do painel

Os crons do Odin quebraram quando foram executados sem o ambiente correto.

O caso mais importante foi:

- rodar `php` sem `LD_LIBRARY_PATH=/home/xtreamcodes/iptv_xtream_codes/libcompat`

Isso gerou falha de carregamento de biblioteca e interrompeu rotinas como:

- `servers_checker.php`
- `balancer.php`
- atualizações de cache e status

Conclusão:

- qualquer cron ionCube do Odin deve ser testado com o mesmo ambiente do painel
- antes de culpar banco ou rede, validar se o binário CLI está carregando as libs corretas

### 3. O erro real dos LBs era banco recusando conexão

Os LBs estavam vivos em rede, mas o endpoint deles respondia:

- `{"main_fetch":false,"error":"MySQL: Connection refused"}`

Ou seja:

- o serviço do LB subia
- o banco principal não estava acessível para eles

### 4. Abrimos o MariaDB principal sem documentar a razão e o risco

Para restaurar a operação, foi necessário mudar temporariamente o bind do MariaDB principal para:

- `0.0.0.0:7999`

Antes ele estava preso em:

- `127.0.0.1:7999`

Isso resolveu a conectividade dos LBs, mas deixa uma lição importante:

- em ambiente espelhado, o ideal é não depender de um `bind-address` aberto no principal para sustentar o painel inteiro
- a arquitetura correta deve preferir réplica local, acesso mínimo e regras explícitas de rede

### 5. Um restart de serviços pode mascarar a causa real

O `start_services.sh` mostrou sucesso em alguns pontos porque os processos principais subiram, mas isso não significa que o ecossistema completo estava saudável.

O checklist correto precisa ir além do "script terminou":

- `nginx` ouvindo
- `php-fpm` ouvindo
- MariaDB acessível
- `system_api.php` retornando `main_fetch:true`
- LBs respondendo sem `Connection refused`

## Regras de segurança para o futuro

### Regra 1: nunca alterar o banco principal sem backup e motivo claro

Antes de mexer em `bind-address`, porta ou autenticação:

- fazer backup do arquivo atual
- registrar o motivo
- testar o acesso local
- testar o acesso remoto autorizado

### Regra 2: sempre validar o config criptografado

Quando o Odin estiver envolvido, a verificação mínima é:

- ler `/home/xtreamcodes/iptv_xtream_codes/config`
- confirmar `host`
- confirmar `db_port`
- confirmar `db_user`
- confirmar `db_pass`
- confirmar `db_name`

### Regra 3: tratar o espelhamento como leitura por padrão

O MariaDB espelhado local deve ser usado para:

- leitura
- diagnóstico
- análise de dados
- contingência

Ele não deve virar o ponto de escrita principal sem uma migração consciente.

### Regra 4: diferenciar três camadas

Sempre separar mentalmente:

- painel Mago
- Odin principal
- MariaDB espelhado local

Se uma camada cair, não assumir que as outras também caíram.

### Regra 5: testar com endpoints reais

Os testes que realmente provam que o sistema voltou são:

- conexão `mysql`
- `python2 /home/xtreamcodes/iptv_xtream_codes/config.py decrypt`
- chamada ao `system_api.php`
- validação dos LBs depois do restart

## Checklist de recuperação segura

1. Verificar se o MariaDB principal está online.
2. Confirmar o bind e a porta reais.
3. Validar o config criptografado do Odin.
4. Rodar os crons com `LD_LIBRARY_PATH` correto.
5. Subir o `start_services.sh`.
6. Testar `system_api.php` no main e em pelo menos um LB.
7. Só então confirmar que o espelhamento está confiável.

## Resumo da falha

O erro não foi “um só”.

Foi uma soma de fatores:

- leitura parcial da configuração
- ambiente CLI diferente do ambiente do painel
- dependência de banco principal não documentada
- bind do MariaDB restrito demais para o fluxo dos LBs

O objetivo desta nota é garantir que, na próxima intervenção, a gente siga o caminho certo desde o começo.

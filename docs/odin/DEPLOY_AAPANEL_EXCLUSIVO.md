# Deploy Exclusivo do `gerar.suafontee.com`

Este projeto deve rodar de forma isolada para não conflitar com outros sites do aaPanel.

## Estrutura usada

- Aplicação Node/TanStack Start em `/www/wwwroot/gerar.suafontee.com/hug-buddy`
- Porta interna do app: `6328`
- Nginx exclusivo em `/etc/nginx/conf.d/gerar.suafontee.com.conf`
- Serviço dedicado do systemd: `gerar-hug-buddy.service`
- Cadastro Odin local persistente em `/www/wwwroot/gerar.suafontee.com/hug-buddy/.odin-config.json`

## Regras de segurança

- Não reutilizar vhost de outro domínio.
- Não usar symlink apontando para arquivos de outros projetos.
- Não misturar a porta do app com outros serviços.
- Manter `/.well-known/` liberado apenas para validação SSL.
- Manter `.odin-config.json` fora do Git e apenas neste servidor.

## Fluxo de operação

1. O systemd sobe o app com `bun run start`.
2. O Nginx do domínio faz proxy para `127.0.0.1:6328`.
3. O certificado TLS deve ser emitido para `gerar.suafontee.com` e apontado só para este domínio.

## Observação

Se for necessário alterar algo, edite apenas:

- `/etc/nginx/conf.d/gerar.suafontee.com.conf`
- `/etc/systemd/system/gerar-hug-buddy.service`

Assim os outros projetos do servidor permanecem intactos.

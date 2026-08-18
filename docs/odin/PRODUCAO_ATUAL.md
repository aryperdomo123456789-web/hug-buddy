# Producao Atual do `gerar.suafontee.com`

Este documento descreve, de forma rastreavel, qual codigo e quais artefatos a URL `https://gerar.suafontee.com/` consome no estado atual do projeto.

## Resposta curta

A rota `/` nao consome um arquivo solto de front-end.
Ela e servida pela aplicacao TanStack Start, que compila os arquivos-fonte em dois artefatos principais:

- `.output/server/index.mjs` para o lado servidor
- `.output/public/assets/index-*.js` para o bundle do cliente

Ou seja: o que a producao consome e a saida do build gerada a partir do codigo-fonte deste repositorio.

## Cadeia de execucao da URL `/`

1. O dominio `gerar.suafontee.com` aponta para o app Node/TanStack Start no aaPanel.
2. O servidor Node entra por `src/server.ts`.
3. `src/server.ts` repassa a requisicao para `@tanstack/react-start/server-entry`.
4. O roteador gerado em `src/routeTree.gen.ts` resolve a rota `/`.
5. A pagina principal da rota `/` vem de `src/routes/index.tsx`.
6. O shell global da aplicacao vem de `src/routes/__root.tsx`.
7. O bootstrap da aplicacao vem de `src/start.ts`.

## Arquivos-fonte efetivamente consumidos

### Entrada do servidor

- `src/server.ts`

Responsavel por:

- servir os assets estaticos
- interceptar `/api/public/install`
- interceptar `/api/public/provision`
- encaminhar o restante para o motor TanStack Start

### Bootstrap do app

- `src/start.ts`

Responsavel por:

- instalar os listeners de erro global
- registrar o middleware de auth da Supabase

### Shell global

- `src/routes/__root.tsx`

Responsavel por:

- definir `<HeadContent />`
- carregar o CSS global
- montar o `RuntimeErrorBubble`
- montar o `Toaster`
- renderizar as rotas filhas com `<Outlet />`

### Rota principal `/`

- `src/routes/index.tsx`

Responsavel por:

- proteger o acesso com `getCurrentPanelSession()`
- carregar snapshot inicial com `getOdinFullData()`
- renderizar o dashboard principal
- sincronizar clientes, revendas, servidores e bouquets
- canalizar erros para o sistema de rastreio

### Sincronizacao e actions de dados

- `src/hooks/use-odin.ts`
- `src/lib/server.functions.ts`
- `src/lib/panel-auth.functions.ts`
- `src/lib/panel-auth.server.ts`
- `src/lib/odin.ts`
- `src/lib/odin-runtime.server.ts`

Esses arquivos controlam:

- leitura do Odin
- autenticacao do painel
- operacoes de CRUD
- configuracao local persistida
- tratamento de falhas de transporte e retry

### Telemetria de falhas

- `src/lib/runtime-error-bus.ts`
- `src/lib/runtime-error-listeners.ts`
- `src/lib/lovable-error-reporting.ts`
- `src/components/ui/runtime-error-bubble.tsx`

Esses arquivos garantem:

- rastreio unificado de erro
- deduplicacao de ocorrencias
- contexto por rota e fase
- exibicao da bolha de erro sem derrubar o restante da interface

## O que esta realmente em producao

No estado atual deste repositorio, a producao e composta por:

- o codigo-fonte que alimenta o build
- o build gerado em `.output/`
- o proxy do aaPanel/Nginx apontando para a porta interna do app

Se o deploy foi feito a partir deste checkout, o conjunto acima e o que esta sendo consumido.
Se existir um deploy antigo em outro servidor, revalide o commit e o build gerado naquele host.

## Como verificar exatamente o snapshot publicado

1. Confirme o commit do checkout em producao:
   - `git rev-parse HEAD`
2. Gere o build:
   - `bun run build`
3. Inspecione os artefatos finais:
   - `.output/server/index.mjs`
   - `.output/public/assets/index-*.js`
   - `.output/nitro.json`
4. Confira o roteamento:
   - `src/routeTree.gen.ts`
   - `src/routes/index.tsx`
   - `src/routes/__root.tsx`

## Regra pratica de manutencao

- Alteracoes visuais e de fluxo da home devem ir em `src/routes/index.tsx` e componentes de `src/components/dashboard/`.
- Alteracoes de boot, headers, middleware e roteamento raiz devem ir em `src/server.ts`, `src/start.ts` e `src/routes/__root.tsx`.
- Qualquer mudanca de dados do Odin deve passar por `src/lib/server.functions.ts` ou pelo hook `src/hooks/use-odin.ts`.

## Observacao importante

Este projeto esta em modo de evolucao, entao o codigo consumido em producao e sempre o resultado do ultimo build implantado.
Para evitar ambiguidade, documente sempre:

- commit do repositorio
- data do build
- artefato gerado em `.output/`

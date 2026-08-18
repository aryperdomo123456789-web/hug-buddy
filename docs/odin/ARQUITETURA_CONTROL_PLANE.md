# Arquitetura do Control Plane Mago

Este documento define a regra principal do projeto `hug-buddy`:

- o Odin oficial continua intocado
- o Mago Panel vira a camada de controle, leitura e provisionamento
- a escrita sensível acontece por token e validação no backend
- o painel local nunca depende de alteração manual no código do Odin oficial

## Objetivo

Construir um painel SaaS que permita:

- visualizar o estado do Odin em tempo real
- criar revendas e clientes com segurança
- mover clientes entre revendas somente para o Dono
- manter o Odin oficial como sistema de origem

## Separação de responsabilidades

### 1. Odin oficial

Responsável por:

- autenticação interna do motor IPTV
- execução dos serviços legados
- consistência do banco principal
- status de streams, clientes, servidores e revendas

### 2. Mago Panel

Responsável por:

- login próprio do painel
- leitura segura dos dados do Odin
- espelhamento do estado para dashboard
- provisionamento via token
- gestão SaaS de usuários do painel

### 3. MariaDB espelhado local

Responsável por:

- consultas analíticas
- cache e auditoria
- leitura de apoio

Ele não deve virar o banco principal por acidente.

## Regras de escrita

### Dono

O Dono pode:

- criar revendedores
- editar revendedores
- remover revendedores
- criar clientes
- mover clientes entre revendas
- salvar configuração do Odin
- gerar e revogar tokens de provisionamento

### Revendedor

O Revendedor pode:

- criar clientes apenas dentro da própria revenda
- editar clientes próprios
- derrubar conexões dos próprios clientes

Ele não pode:

- criar revendedores
- mover clientes para outra revenda
- alterar a configuração do Odin

## Fluxo recomendado

1. O usuário entra no Mago Panel com login próprio.
2. O painel carrega os dados do Odin em modo leitura.
3. Operações de escrita passam por middleware de autenticação.
4. A criação de revendas e clientes usa token de provisionamento quando necessário.
5. O Odin oficial permanece sem patch local no painel externo.

## O que nunca fazer

- editar arquivos do Odin oficial para resolver problemas do Mago Panel
- depender do painel oficial para a lógica de SaaS do Mago
- compartilhar o mesmo fluxo de escrita entre dono e revendedor sem validação de escopo
- assumir que o banco principal está sempre aberto para escrita remota

## Resultado esperado

O usuário deve enxergar o Mago Panel como:

- uma central SaaS
- um espelho operacional do Odin
- uma camada segura para provisionar novos negócios sem tocar no painel oficial

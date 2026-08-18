# Provisionamento Odin via Token

## Objetivo
Permitir que o Mago Panel crie revendas e clientes no Odin sem expor acesso direto ao MariaDB.

## Fluxo
1. O Dono entra no painel.
2. Na aba `Configuração Odin > Tokens Odin`, ele gera um token de provisionamento.
3. O token é usado em chamadas HTTP para o endpoint público.
4. O endpoint valida o token, executa a inserção no Odin via SSH/MySQL e grava um log local do evento.

## Segurança
- O token é salvo localmente apenas como hash.
- O valor completo do token é exibido somente no momento da criação.
- O token pode expirar e também pode ser revogado no painel.
- O endpoint público aceita apenas `create_reseller` e `create_user`.

## Endpoint Público

`POST /api/public/provision`

### Cabeçalhos aceitos
- `Authorization: Bearer <token>`
- `X-Odin-Token: <token>`

### Payload
```json
{
  "action": "create_reseller",
  "payload": {
    "username": "revenda1",
    "password": "123456",
    "email": "revenda1@exemplo.com",
    "owner_id": 1,
    "credits": 0,
    "active": 1,
    "member_group_id": 2
  }
}
```

Para cliente:
```json
{
  "action": "create_user",
  "payload": {
    "username": "cliente1",
    "password": "123456",
    "owner_id": 1,
    "exp_date": 1893456000,
    "enabled": 1,
    "admin_enabled": 1,
    "is_trial": 0,
    "is_restreamer": 0,
    "is_isplock": 0,
    "max_connections": 1,
    "bouquet": "[]",
    "admin_notes": "",
    "allowed_ips": "",
    "allowed_ua": "",
    "forced_country": "Off"
  }
}
```

## Registro Local
Os eventos ficam registrados em:
- `.odin-provision-tokens.json`
- `.odin-provision-audit.jsonl`

## Troca futura de Odin
Se o Odin mudar de host, porta ou credenciais:
1. Atualize `Configuração Odin` no painel.
2. Gere novos tokens, se desejar.
3. O endpoint público continua o mesmo.

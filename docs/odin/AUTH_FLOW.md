---
name: Fluxo de Autenticação e Logout SaaS
description: Implementação do sistema de login Supabase, rotas protegidas e função de logout para o Mago Panel.
type: feature
---

# Fluxo de Autenticação SaaS

## 1. Rotas Protegidas
- O painel agora utiliza um gate de autenticação via Supabase no `beforeLoad` da rota principal.
- Tentativas de acesso à raiz `/` sem sessão ativa são redirecionadas automaticamente para `/auth`.

## 2. Interface de Login (`/auth`)
- Design Dark Profissional (Glassmorphism).
- Integração com Supabase Auth (E-mail/Senha).
- Suporte a criação de conta e login.
- Redirecionamento inteligente pós-login.

## 3. Gestão de Sessão e Logout
- **Logout:** Botão "Sair do Painel" adicionado à sidebar.
- **Segurança:** Limpeza completa da sessão Supabase ao sair.

---

## 4. Como Usar no aaPanel
1. O Mago Panel está pronto para deploy.
2. Certifique-se de configurar as chaves do Supabase no ambiente de produção.

# Plano de Responsividade Mobile-First - Mago Panel

O objetivo é transformar o Mago Panel em uma aplicação 100% responsiva, garantindo uma experiência fluida desde dispositivos móveis (320px) até desktops de alta resolução (1920px).

## 1. Estrutura Base e Navegação
- **Sidebar para Drawer:** Converter a sidebar fixa em um drawer mobile acessível via menu hambúrguer.
- **Layout de Grade:** Ajustar o `flex gap-10` da estrutura principal para empilhamento vertical em telas pequenas.
- **Padding e Espaçamento:** Reduzir paddings excessivos (`p-10`) em mobile.

## 2. Componentes de Dashboard
- **StatCards:** Grid de 1 coluna em mobile, 2 em tablet, 4 em desktop.
- **Tabelas Responsivas:** Implementar scroll horizontal ou visualização em cards para tabelas de Clientes, Streams e Revendedores.
- **Modais:** Garantir que modais ocupem 100% da largura em mobile com altura adaptável.

## 3. Melhorias de UI/UX Mobile
- **Touch Targets:** Aumentar botões e áreas clicáveis para o padrão mínimo de 44x44px.
- **Tipografia:** Ajustar escalas de texto (font-size) via Tailwind breakpoints.

## Detalhes Técnicos
- Uso extensivo de classes utilitárias do Tailwind (`md:`, `lg:`, `hidden`, `block`).
- Implementação de um `MobileNav` fixo ou botão flutuante para abertura do menu.
- Refatoração dos componentes de lista (`CustomerList`, `ServerList`, etc.) para lidar com overflow adequadamente.

---
*Este plano foca na intenção do usuário de tornar o app mobile-friendly sem alterar a lógica de backend SSH/Odin.*

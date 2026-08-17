#!/bin/bash

# MAGO PANEL - AUTO DEPLOY FOR AAPANEL
# Este script prepara o ambiente para o Mago Panel no aaPanel.

echo "🚀 Iniciando Deploy do Mago Panel..."

# 1. Verificar Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Node.js não encontrado. Por favor, instale o 'Node.js Version Manager' no aaPanel."
    exit 1
fi

echo "✅ Node.js detectado: $(node -v)"

# 2. Instalar dependências
echo "📦 Instalando dependências..."
bun install || npm install

# 3. Build da aplicação
echo "🏗️ Criando build de produção (TanStack Start)..."
bun run build || npm run build

# 4. Instruções Finais
echo ""
echo "----------------------------------------------------"
echo "✅ BUILD CONCLUÍDO COM SUCESSO!"
echo "----------------------------------------------------"
echo "Para rodar no aaPanel:"
echo "1. Vá em 'Website' -> 'Node project'"
echo "2. Adicione um novo projeto"
echo "3. Project Path: $(pwd)"
echo "4. Run Command: bun run start (ou npm run start)"
echo "5. Port: 6328 (Obrigatório conforme documentação)"
echo "6. NGINX: Deve ser criado um arquivo de configuração exclusivo para este projeto."
echo "----------------------------------------------------"
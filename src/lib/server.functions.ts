import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Script de instalação customizado para o Mago Panel.
 * Inspirado na arquitetura do Sigma, mas focado na sua infra.
 */
export const getInstallScript = createServerFn({ method: "GET" })
  .handler(async () => {
    const script = `#!/bin/bash
# ==========================================================
# MAGO PANEL - INSTALADOR DE API (GUERRA DIGITAL)
# ==========================================================
# Esse script prepara seu servidor Xtream/NXT para o Mago Panel.

DOMAIN="https://71a12a47-d6b3-4362-a2b3-4497a0a13af3.lovableproject.com" # URL do seu painel

echo "Iniciando a Forja..."

# Verifica se é um servidor compatível
if [ ! -d "/home/xtreamcodes/iptv_xtream_codes/wwwdir" ] && [ ! -d "/home/nxt/public" ]; then
  echo "ERRO: Servidor incompatível. Precisa de Xtream UI ou NXT."
  exit 1
fi

# Cria o diretório da API
API_DIR="/home/xtreamcodes/iptv_xtream_codes/wwwdir/mago-api"
if [ -d "/home/nxt/public" ]; then
    API_DIR="/home/nxt/public/mago-api"
fi

mkdir -p $API_DIR
cd $API_DIR || exit

# Gera um Token Único se não existir
if [ ! -f "token.txt" ]; then
    TOKEN=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    echo $TOKEN > token.txt
else
    TOKEN=$(cat token.txt)
fi

# Aqui baixariamos o arquivo PHP da API (exemplo simbólico)
# wget $DOMAIN/api/download-api -O index.php

echo "------------------------------------------"
echo "MAGO PANEL - INSTALAÇÃO CONCLUÍDA"
echo "TOKEN: $TOKEN"
echo "URL DA API: $(curl -s icanhazip.com)/mago-api/"
echo "------------------------------------------"
`;
    return script;
  });

/**
 * Valida o token e conecta o servidor ao painel.
 */
export const connectServer = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ 
    ip: z.string(),
    token: z.string().min(32),
    label: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    // Aqui você salvaria no Lovable Cloud (Supabase) os detalhes do servidor
    console.log("Tentando conectar ao servidor:", data.ip);
    
    
    // Simulação de sucesso
    return { 
      success: true, 
      message: "Servidor conectado com sucesso! O império está crescendo.",
      serverId: "srv_" + Math.random().toString(36).substr(2, 9)
    };
  });

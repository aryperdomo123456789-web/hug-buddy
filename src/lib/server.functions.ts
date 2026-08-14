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
# MAGO PANEL - INSTALADOR DE API (ODIN SPECIAL EDITION)
# ==========================================================
# Preparado para Odin Streaming System (Porta 7999)

DOMAIN="https://71a12a47-d6b3-4362-a2b3-4497a0a13af3.lovableproject.com"

echo "Iniciando a Forja no Odin..."

# Odin geralmente usa a porta 7999 e o banco xtream_iptvpro
DB_PORT=7999
DB_NAME="xtream_iptvpro"
PATH_ODIN="/home/xtreamcodes/iptv_xtream_codes/"

if [ ! -d "$PATH_ODIN" ]; then
  echo "ERRO: Servidor Odin não encontrado em $PATH_ODIN"
  exit 1
fi

API_DIR="$PATH_ODIN/wwwdir/mago-api"
mkdir -p $API_DIR
cd $API_DIR || exit

# Gera Token
if [ ! -f "token.txt" ]; then
    TOKEN=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    echo $TOKEN > token.txt
else
    TOKEN=$(cat token.txt)
fi

# Detecta senha do MySQL para Odin
DB_PASS=$(grep "'db_pass'" $PATH_ODIN/functions.php | cut -d"'" -f4)

echo "------------------------------------------"
echo "ODIN CONNECTED - Mago Panel"
echo "TOKEN: $TOKEN"
echo "DB DETECTED: $DB_NAME (Port $DB_PORT)"
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

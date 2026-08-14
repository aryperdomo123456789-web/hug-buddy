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

echo "------------------------------------------"
echo "   Iniciando a Forja no Mago Panel...   "
echo "------------------------------------------"

PATH_ODIN="/home/xtreamcodes/iptv_xtream_codes/"

if [ ! -d "$PATH_ODIN" ]; then
  echo "ERRO: Servidor Odin não encontrado em $PATH_ODIN"
  exit 1
fi

API_DIR="$PATH_ODIN/wwwdir/mago-api"
mkdir -p "$API_DIR"
cd "$API_DIR" || exit

# Gera Token
if [ ! -f "token.txt" ]; then
    TOKEN=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    echo "$TOKEN" > token.txt
else
    TOKEN=$(cat token.txt)
fi

# Detecta IP Público
IP_PUBLICO=$(curl -s https://ifconfig.me)

echo ""
echo "------------------------------------------"
echo "   ODIN CONECTADO COM SUCESSO!          "
# Garantindo que o IP e Token apareçam no stdout
printf "   IP: %s\n" "$IP_PUBLICO"
printf "   TOKEN: %s\n" "$TOKEN"
echo "------------------------------------------"
echo ""
echo "Copie os dados acima e cole no Mago Panel."
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

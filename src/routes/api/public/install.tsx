import { createFileRoute } from '@tanstack/react-router'
import { getOdinRuntimeConfig } from '@/lib/odin-runtime.server'

export const Route = createFileRoute('/api/public/install')({
  server: {
    handlers: {
      GET: async () => {
        const cfg = getOdinRuntimeConfig()
        const token = cfg.apiToken

        const script = `#!/bin/bash
# Mago Panel - Remote Installer for Odin v6
# ========================================

TOKEN="${token}"
API_URL="https://\${HOSTNAME:-$(hostname -I | awk '{print $1}')}:6328/api/public"

echo "Mago Panel: Iniciando integração com Odin v6..."

# Ensure token.txt exists in Odin directory
ODIN_DIR="/home/xtreamcodes/iptv_xtream_codes"
if [ -d "$ODIN_DIR" ]; then
    echo "$TOKEN" > "$ODIN_DIR/token.txt"
    chown xtreamcodes:xtreamcodes "$ODIN_DIR/token.txt"
    chmod 644 "$ODIN_DIR/token.txt"
    echo "Mago Panel: Token injetado com sucesso."
else
    echo "Mago Panel: Erro - Diretorio Odin não encontrado."
    exit 1
fi

echo "Mago Panel: Integracao concluida!"
`
        return new Response(script, {
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      },
    },
  },
})

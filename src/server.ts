import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    // Interceptação manual ANTES do roteador TanStack
    if (url.pathname === '/api/public/install') {
      try {
        const script = `#!/bin/bash
# Mago Panel - Odin v6 Installer
# Estudei o Sigma e fiz melhor.

trim() {
    echo "$1" | xargs
}

PATH_ODIN="/home/xtreamcodes/iptv_xtream_codes/"
API_DIR="$PATH_ODIN/wwwdir/mago-api"

echo "#######################################"
####### MAGO PANEL - INSTALADOR #######
#######################################

if [ ! -d "$PATH_ODIN" ]; then
  echo "ERRO: Servidor Odin não encontrado em $PATH_ODIN"
  exit 1
fi

mkdir -p "$API_DIR/logs"
chmod -R 777 "$API_DIR/logs"
cd "$API_DIR"

if [ ! -f "token.php" ]; then
    echo "Gerando novo token de segurança..."
    TOKEN=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    echo "<?php \\$token = '$TOKEN';" > token.php
else
    TOKEN=$(awk -F"'" '/\\$token/{print $2}' "token.php")
fi

# Criação do arquivo de versão para compatibilidade
echo "{\\"result\\":{\\"version\\":\\"1.0.0-mago\\",\\"script\\":\\"odin-v6\\"}}" > version.json

IP_PUBLICO=$(curl -s -4 icanhazip.com || curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')

echo ""
echo "------------------------------------"
echo "TOKEN DO MAGO PANEL: $TOKEN"
echo "URL DA API: http://$IP_PUBLICO/mago-api/"
echo "------------------------------------"
echo "Instalação concluída com sucesso!"
echo "------------------------------------"
`;
        return new Response(script, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store, no-cache',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      } catch (err) {
        console.error('API INTERCEPT ERROR:', err);
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

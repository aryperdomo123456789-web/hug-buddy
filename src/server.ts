import "./lib/error-capture";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, resolve, basename } from "node:path";
import NodeWebSocket from "ws";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { getOdinRuntimeConfig } from "./lib/odin-runtime.server";
import { generateBashScript } from "./lib/server.functions";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = NodeWebSocket as unknown as typeof globalThis.WebSocket;
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
const PUBLIC_DIR = resolve(process.cwd(), ".output/public");
const STATIC_ALIAS_MAP: Record<string, string> = {
  "/assets/index-DH0HoCLT.js": "/assets/index-CgzBBL-3.js",
  "/assets/index-CrDPA1md.js": "/assets/index-CgzBBL-3.js",
  "/assets/routes-BKJAVR7L.js": "/assets/routes-C0xH3diB.js",
  "/assets/shield-alert-DB9zb1Ie.js": "/assets/shield-alert-BID6hsR1.js",
  "/assets/shield-alert-JTY8bwcF.js": "/assets/shield-alert-BID6hsR1.js",
  "/assets/auth-mGiIDYOT.js": "/assets/auth-2KSmy2fy.js",
  "/assets/auth-BHbh4lYE.js": "/assets/auth-2KSmy2fy.js",
};

function getContentType(pathname: string): string {
  const ext = extname(pathname).toLowerCase();
  switch (ext) {
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    case ".map":
      return "application/json; charset=utf-8";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}

function resolveStaticFile(pathname: string): string | null {
  const safePath = decodeURIComponent(STATIC_ALIAS_MAP[pathname] ?? pathname);
  const directPath = resolve(PUBLIC_DIR, `.${safePath}`);
  if (directPath.startsWith(PUBLIC_DIR) && existsSync(directPath) && statSync(directPath).isFile()) {
    return directPath;
  }

  if (!safePath.startsWith("/assets/")) {
    return null;
  }

  const assetsDir = resolve(PUBLIC_DIR, "assets");
  const requestedName = basename(safePath);
  const exactCandidate = resolve(assetsDir, requestedName);
  if (exactCandidate.startsWith(assetsDir) && existsSync(exactCandidate) && statSync(exactCandidate).isFile()) {
    return exactCandidate;
  }

  const [prefix, ...suffixParts] = requestedName.split("-");
  const suffix = suffixParts.length > 0 ? `-${suffixParts.join("-")}` : "";
  const ext = extname(requestedName);
  if (!prefix || !ext) {
    return null;
  }

  const matches = readdirSync(assetsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.startsWith(`${prefix}-`) && entry.name.endsWith(ext))
    .map((entry) => entry.name)
    .sort();

  if (!matches.length) {
    return null;
  }

  const exactHashMatch = matches.find((name) => name === requestedName);
  const samePrefixMatch = matches.find((name) => name.startsWith(`${prefix}-`) && (suffix.length === 0 || name.endsWith(ext)));
  const chosen = exactHashMatch || samePrefixMatch || matches[0];
  return resolve(assetsDir, chosen);
}

function serveStaticAsset(pathname: string): Response | null {
  const filePath = resolveStaticFile(pathname);
  if (!filePath) return null;

  const body = readFileSync(filePath);
  const headers = new Headers({
    "content-type": getContentType(filePath),
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
  });

  return new Response(body, { status: 200, headers });
}

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

function applyNoStoreToHtml(response: Response): Response {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  headers.set("pragma", "no-cache");
  headers.set("expires", "0");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
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

    const staticAssetResponse = serveStaticAsset(url.pathname);
    if (staticAssetResponse) {
      return staticAssetResponse;
    }

    // Interceptação manual ANTES do roteador TanStack
    if (url.pathname === '/api/public/install') {
      try {
        const cfg = getOdinRuntimeConfig();
        const script = generateBashScript(cfg.apiToken, cfg.sshHost);
        
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

    if (url.pathname === "/api/public/provision") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
      }

      try {
        const authHeader = request.headers.get("authorization") || request.headers.get("x-odin-token") || "";
        const body = await request.json().catch(() => null) as null | {
          token?: string;
          action?: "create_reseller" | "create_user";
          payload?: Record<string, any>;
        };

        const token = (body?.token || authHeader.replace(/^Bearer\s+/i, "")).trim();
        const action = body?.action;
        const payload = body?.payload || {};

        if (!token) {
          return Response.json({ success: false, error: "Token ausente." }, { status: 401 });
        }

        if (action !== "create_reseller" && action !== "create_user") {
          return Response.json({ success: false, error: "Ação inválida." }, { status: 400 });
        }

        const { provisionViaToken } = await import("./lib/odin-token.server");
        const result = await provisionViaToken({ token, action, payload });

        return Response.json(result, {
          status: result.success ? 200 : 400,
          headers: {
            "Cache-Control": "no-store, no-cache",
          },
        });
      } catch (err: any) {
        console.error("PROVISION API ERROR:", err);
        return Response.json(
          { success: false, error: err?.message || "Internal Server Error" },
          { status: 500 },
        );
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applyNoStoreToHtml(normalized);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

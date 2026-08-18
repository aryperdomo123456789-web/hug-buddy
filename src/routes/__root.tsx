import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { RuntimeErrorBubble } from "@/components/ui/runtime-error-bubble";
import { installRuntimeErrorListeners } from "@/lib/runtime-error-listeners";

installRuntimeErrorListeners();

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] px-4 py-6 text-zinc-100">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8 shadow-[0_24px_120px_rgba(0,0,0,0.45)]">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            Erro isolado
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">
            O painel encontrou uma falha nesta rota
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            O restante do sistema continua preservado. O erro foi canalizado para a bolha
            interativa no canto da tela para você inspecionar sem perder o contexto.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => {
                router.invalidate();
                reset();
              }}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Tentar novamente
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              Voltar ao painel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mago Panel - Central de Comando IPTV" },
      { name: "description", content: "O painel definitivo para gerenciar seu servidor Xtream UI com maestria." },
      { name: "author", content: "Mago Dev" },
      { property: "og:title", content: "Mago Panel - Domine o Mercado" },
      { property: "og:description", content: "Gestão profissional de servidores IPTV com automação e segurança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@MagoDev" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const runtimeErrorBootstrap = `(function(){try{if(window.__magoRuntimeErrorListenersInstalled)return;window.__magoRuntimeErrorListenersInstalled=true;var EVENT_NAME="mago-runtime-error";var route=window.location.pathname;function emit(entry){window.__magoRuntimeErrorLatest=entry;window.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:entry}));}function fingerprint(parts){return[parts.title,parts.message,route,parts.phase||"",parts.locationLabel||"",parts.stackHead||""].join("|");}function makeEntry(source,phase,title,message,details,locationLabel,stackHead){var now=Date.now();return{id:String(now)+"-"+Math.random().toString(36).slice(2,8),title:title,message:message,details:details,route:route,source:source,phase:phase,locationLabel:locationLabel,stackHead:stackHead,fingerprint:fingerprint({title:title,message:message,phase:phase,locationLabel:locationLabel,stackHead:stackHead}),occurrences:1,createdAt:now,updatedAt:now};}function firstStackLine(stack){if(!stack)return undefined;var lines=String(stack).split("\\n").map(function(line){return line.trim();}).filter(Boolean);return lines.length?lines[0]:undefined;}function normalizeError(error,source,phase,locationLabel){if(error instanceof Error){var stack=error.stack||"";return makeEntry(source,phase,error.name||"Erro",error.message||"Ocorreu um erro inesperado.",stack,locationLabel,firstStackLine(stack));}if(typeof error==="string"){return makeEntry(source,phase,"Erro",error,undefined,locationLabel,undefined);}try{return makeEntry(source,phase,"Erro","Ocorreu um erro inesperado.",JSON.stringify(error,null,2),locationLabel,undefined);}catch(_err){return makeEntry(source,phase,"Erro","Ocorreu um erro inesperado.",String(error),locationLabel,undefined);}}window.addEventListener("error",function(event){try{var message=event.message||"Erro de execução";var error=event.error;var locationLabel=event.filename?event.filename+(event.lineno?":"+event.lineno:"")+(event.colno?":"+event.colno:""):undefined;var entry=error instanceof Error?normalizeError(error,"window","window",locationLabel):makeEntry("window","window","Erro de execução",message,[message,locationLabel?("Local: "+locationLabel):null].filter(Boolean).join("\\n"),locationLabel,undefined);emit(entry);}catch(_err){}} ,true);window.addEventListener("unhandledrejection",function(event){try{var reason=event.reason;var entry=reason instanceof Error?normalizeError(reason,"rejection","rejection",reason.stack&&firstStackLine(reason.stack)?firstStackLine(reason.stack):undefined):normalizeError(typeof reason==="string"?reason:"Promise rejeitada","rejection","rejection",undefined);emit(entry);}catch(_err){}});if(window.__magoRuntimeErrorLatest){window.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:window.__magoRuntimeErrorLatest}));}}catch(_err){}})();`;
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: runtimeErrorBootstrap }} />
      </head>
      <body className="dark">
        {children}
        <RuntimeErrorBubble />
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Copy, RefreshCw, X } from "lucide-react";

import {
  clearRuntimeError,
  RUNTIME_ERROR_EVENT,
  subscribeRuntimeError,
  type RuntimeErrorEntry,
} from "@/lib/runtime-error-bus";

function formatTimestamp(createdAt: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(createdAt));
}

function buildCopyText(entry: RuntimeErrorEntry) {
  return [
    `Título: ${entry.title}`,
    `Mensagem: ${entry.message}`,
    `Origem: ${entry.source}`,
    entry.phase ? `Fase: ${entry.phase}` : null,
    entry.route ? `Rota: ${entry.route}` : null,
    entry.locationLabel ? `Local: ${entry.locationLabel}` : null,
    entry.stackHead ? `Stack: ${entry.stackHead}` : null,
    `Ocorrências: ${entry.occurrences}`,
    `Horário: ${formatTimestamp(entry.createdAt)}`,
    `Atualizado: ${formatTimestamp(entry.updatedAt)}`,
    entry.details ? `Detalhes:\n${entry.details}` : null,
    entry.componentStack ? `Component stack:\n${entry.componentStack}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function RuntimeErrorBubble() {
  const [entry, setEntry] = useState<RuntimeErrorEntry | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const syncFromWindow = () => {
      if (typeof window === "undefined") return;
      setEntry(window.__magoRuntimeErrorLatest ?? null);
    };

    syncFromWindow();
    const unsubscribe = subscribeRuntimeError(setEntry);
    window.addEventListener(RUNTIME_ERROR_EVENT, syncFromWindow as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener(RUNTIME_ERROR_EVENT, syncFromWindow as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!entry) {
      setExpanded(false);
      setCopied(false);
    }
  }, [entry]);

  const copyText = useMemo(() => (entry ? buildCopyText(entry) : ""), [entry]);

  if (!entry) return null;

  const isHttpError = entry.title.startsWith("HTTP ");
  const toneClass =
    entry.phase === "loader"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : entry.phase === "render"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
        : "border-sky-500/30 bg-sky-500/10 text-sky-300";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[min(26rem,calc(100vw-1rem))]">
      <div className="overflow-hidden border border-rose-500/30 bg-[#0b0b10]/95 text-zinc-100 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-start gap-3 px-4 py-3 text-left"
        >
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border ${toneClass}`}>
            <AlertTriangle size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
              Erro canalizado {entry.occurrences > 1 ? `• x${entry.occurrences}` : ""}
            </span>
            <span className="mt-1 block truncate text-sm font-semibold text-zinc-100">
              {entry.title}
            </span>
            <span className="mt-1 block line-clamp-2 text-xs text-zinc-400">
              {entry.message}
            </span>
            <span className="mt-2 block text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              {entry.phase ? `Fase: ${entry.phase}` : "Fase: unknown"}
              {(entry.phase || entry.locationLabel || entry.route) ? " • " : ""}
              {entry.locationLabel ? `Onde: ${entry.locationLabel}` : entry.route ? `Rota: ${entry.route}` : "Onde: desconhecido"}
            </span>
          </span>
          <span className="mt-1 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            {formatTimestamp(entry.createdAt)}
          </span>
        </button>

        {expanded && (
          <div className="border-t border-white/5 px-4 pb-4 pt-3">
            <div className="space-y-3">
              {entry.route ? (
                <div className="rounded-xl border border-zinc-800 bg-black/30 px-3 py-2 text-xs text-zinc-300">
                  <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    Rota
                  </span>
                  <span className="mt-1 block break-all">{entry.route}</span>
                </div>
              ) : null}
              {entry.locationLabel ? (
                <div className="rounded-xl border border-zinc-800 bg-black/30 px-3 py-2 text-xs text-zinc-300">
                  <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    Onde
                  </span>
                  <span className="mt-1 block break-all">{entry.locationLabel}</span>
                </div>
              ) : null}
              {!entry.locationLabel && entry.route ? (
                <div className="rounded-xl border border-zinc-800 bg-black/30 px-3 py-2 text-xs text-zinc-300">
                  <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    Rota
                  </span>
                  <span className="mt-1 block break-all">{entry.route}</span>
                </div>
              ) : null}

              <div className="rounded-xl border border-zinc-800 bg-black/30 px-3 py-2 text-xs text-zinc-300">
                <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                  Detalhe
                </span>
                <span className="mt-1 block whitespace-pre-wrap break-words">
                  {entry.message}
                </span>
                {entry.stackHead ? (
                  <div className="mt-2 rounded-lg border border-zinc-800 bg-black/50 px-2 py-2 text-[11px] text-zinc-400">
                    {entry.stackHead}
                  </div>
                ) : null}
                {entry.details ? (
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-800 bg-black/40 p-2 text-[11px] text-zinc-400">
                    {entry.details}
                  </pre>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                <div className="rounded-lg border border-zinc-800 bg-black/30 px-3 py-2">
                  <span className="block text-zinc-600">Fase</span>
                  <span className="mt-1 block text-zinc-200">{entry.phase || "unknown"}</span>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-black/30 px-3 py-2">
                  <span className="block text-zinc-600">Ocorrências</span>
                  <span className="mt-1 block text-zinc-200">{entry.occurrences}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? "Copiado" : "Copiar erro"}
                </button>
                <button
                  type="button"
                  onClick={handleReload}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 transition-colors hover:border-blue-500/30 hover:bg-blue-500/15"
                >
                  <RefreshCw size={14} />
                  Recarregar rota
                </button>
                <button
                  type="button"
                  onClick={() => clearRuntimeError()}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-transparent px-3 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
                >
                  <X size={14} />
                  Ocultar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

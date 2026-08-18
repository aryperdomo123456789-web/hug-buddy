import { publishRuntimeError } from "./runtime-error-bus";

declare global {
  interface Window {
    __magoRuntimeErrorListenersInstalled?: boolean;
  }
}

export function installRuntimeErrorListeners() {
  if (typeof window === "undefined") return;
  if (window.__magoRuntimeErrorListenersInstalled) return;
  window.__magoRuntimeErrorListenersInstalled = true;

  window.addEventListener("error", (event) => {
    const error = event.error ?? event.message;
    const message = (error instanceof Error ? error.message : String(error || "")).toLowerCase();
    const stack = (error instanceof Error ? error.stack || "" : "").toLowerCase();

    // Silenciar erros de aborto para não aparecerem no editor
    if (
      message.includes("aborted") || 
      message.includes("aborterror") ||
      stack.includes("abortincoming") ||
      stack.includes("socketonclose")
    ) {
      event.preventDefault();
      return;
    }

    publishRuntimeError(event.error ?? event.message ?? "Erro de execução", {
      source: "window",
      phase: "window",
      route: window.location.pathname,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = (reason instanceof Error ? reason.message : String(reason || "")).toLowerCase();
    
    if (message.includes("aborted") || message.includes("aborterror")) {
      event.preventDefault();
      return;
    }

    publishRuntimeError(event.reason ?? "Promise rejeitada", {
      source: "rejection",
      phase: "rejection",
      route: window.location.pathname,
    });
  });
}

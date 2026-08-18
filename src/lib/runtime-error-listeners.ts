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
    publishRuntimeError(event.error ?? event.message ?? "Erro de execução", {
      source: "window",
      phase: "window",
      route: window.location.pathname,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    publishRuntimeError(event.reason ?? "Promise rejeitada", {
      source: "rejection",
      phase: "rejection",
      route: window.location.pathname,
    });
  });
}

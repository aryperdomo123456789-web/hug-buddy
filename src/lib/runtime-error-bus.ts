export type RuntimeErrorEntry = {
  id: string;
  title: string;
  message: string;
  details?: string;
  route?: string;
  source: "boundary" | "window" | "rejection" | "manual";
  phase?: "loader" | "render" | "effect" | "event" | "window" | "rejection" | "manual" | "unknown";
  locationLabel?: string;
  stackHead?: string;
  componentStack?: string;
  fingerprint: string;
  occurrences: number;
  createdAt: number;
  updatedAt: number;
};

type Listener = (entry: RuntimeErrorEntry | null) => void;

declare global {
  interface Window {
    __magoRuntimeErrorLatest?: RuntimeErrorEntry | null;
    __magoRuntimeErrorListenersInstalled?: boolean;
  }
}

export const RUNTIME_ERROR_EVENT = "mago-runtime-error";

let currentEntry: RuntimeErrorEntry | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener(currentEntry);
  }
}

function syncWindowRuntimeErrorState(entry: RuntimeErrorEntry | null) {
  if (typeof window === "undefined") return;
  window.__magoRuntimeErrorLatest = entry;
  window.dispatchEvent(
    new CustomEvent<RuntimeErrorEntry | null>(RUNTIME_ERROR_EVENT, {
      detail: entry,
    }),
  );
}

function commitRuntimeError(entry: RuntimeErrorEntry | null) {
  currentEntry = entry;
  notify();
  syncWindowRuntimeErrorState(entry);
}

function toMessage(
  error: unknown,
): { title: string; message: string; details?: string; stackHead?: string; locationLabel?: string } {
  if (isTransportError(error)) {
    const parsed = error instanceof Error ? parseStack(error.stack) : null;
    const result: { title: string; message: string; details?: string; stackHead?: string; locationLabel?: string } = {
      title: "Falha de transporte",
      message:
        error instanceof Error && error.message
          ? error.message
          : "A requisição não respondeu ou foi bloqueada antes de chegar ao backend.",
    };

    if (error instanceof Error && error.stack) {
      result.details = error.stack;
    } else {
      result.details = safeStringify(error);
    }

    if (parsed?.stackHead) result.stackHead = parsed.stackHead;
    if (parsed?.locationLabel) result.locationLabel = parsed.locationLabel;
    return result;
  }

  if (error instanceof Response) {
    const result: { title: string; message: string; details?: string; stackHead?: string; locationLabel?: string } = {
      title: `HTTP ${error.status}`,
      message: error.statusText || "A requisição falhou.",
    };
    if (error.url) result.details = `URL: ${error.url}`;
    return result;
  }

  if (error instanceof Error) {
    const parsed = parseStack(error.stack);
    const hydrationHint =
      /Minified React error #418|Hydration failed|hydration mismatch|server rendered/i.test(error.message) ||
      /Minified React error #418|Hydration failed|hydration mismatch/i.test(error.stack || "");
    const result: { title: string; message: string; details?: string; stackHead?: string; locationLabel?: string } = {
      title: hydrationHint ? "Hydration mismatch" : error.name || "Erro",
      message: hydrationHint
        ? "O HTML do servidor e o primeiro render do cliente não coincidiram."
        : error.message || "Ocorreu um erro inesperado.",
    };
    if (error.stack) result.details = error.stack;
    if (parsed.stackHead) result.stackHead = parsed.stackHead;
    if (parsed.locationLabel) result.locationLabel = parsed.locationLabel;
    return result;
  }

  if (typeof error === "string") {
    return {
      title: "Erro",
      message: error,
    };
  }

  return {
    title: "Erro",
    message: "Ocorreu um erro inesperado.",
    details: safeStringify(error),
  };
}

function isTransportError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = `${error.name}: ${error.message}`.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("request failed") ||
    message.includes("fetch failed")
  );
}

function parseStack(stack?: string) {
  const frames = (stack || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const interestingFrame = frames.find((frame) => {
    const lower = frame.toLowerCase();
    return (
      !lower.includes("runtime-error-bubble") &&
      !lower.includes("runtime-error-bus") &&
      !lower.includes("lovable-error-reporting") &&
      !lower.includes("reportlovableerror")
    );
  });

  const location = interestingFrame ? extractLocation(interestingFrame) : undefined;
  const locationLabel =
    location && location.file
      ? `${location.file}${location.line ? `:${location.line}` : ""}${location.column ? `:${location.column}` : ""}`
      : undefined;

  return {
    stackHead: interestingFrame,
    locationLabel,
    location,
  };
}

function extractLocation(frame: string) {
  const urlMatch = frame.match(/(https?:\/\/[^\s)]+|file:\/\/[^\s)]+|\/[^\s)]+):(\d+):(\d+)/);
  if (!urlMatch) return null;

  const [, file, line, column] = urlMatch;
  return {
    file,
    line: Number(line),
    column: Number(column),
  };
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function isBenignAbortError(error: unknown): boolean {
  const message = (
    error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? "")
  ).toLowerCase();
  const stack = error instanceof Error ? (error.stack || "").toLowerCase() : "";

  return (
    message === "error: aborted" ||
    message.trim() === "aborted" ||
    message.includes("aborterror") ||
    message.includes("the operation was aborted") ||
    message.includes("the user aborted a request") ||
    stack.includes("abortincoming") ||
    stack.includes("socketonclose")
  );
}

export function publishRuntimeError(
  error: unknown,
  context: {
    source: RuntimeErrorEntry["source"];
    route?: string;
    phase?: RuntimeErrorEntry["phase"];
    componentStack?: string;
  },
) {
  // Cancelamentos de requisição (F5, navegação, socket fechado) não são bugs.
  if (isBenignAbortError(error)) {
    return currentEntry;
  }

  const parts = toMessage(error);
  const fingerprint = [
    parts.title,
    parts.message,
    context.route || "",
    context.phase || "",
    parts.locationLabel || "",
    parts.stackHead || "",
  ].join("|");

  const now = Date.now();
  if (
    currentEntry &&
    currentEntry.fingerprint === fingerprint &&
    now - currentEntry.updatedAt < 2000
  ) {
    const nextEntry: RuntimeErrorEntry = {
      ...currentEntry,
      occurrences: currentEntry.occurrences + 1,
      updatedAt: now,
    };
    if (parts.details) nextEntry.details = parts.details;
    if (parts.stackHead) nextEntry.stackHead = parts.stackHead;
    if (parts.locationLabel) nextEntry.locationLabel = parts.locationLabel;
    if (context.componentStack) nextEntry.componentStack = context.componentStack;
    commitRuntimeError(nextEntry);
    return nextEntry;
  }

  const nextEntry: RuntimeErrorEntry = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: parts.title,
    message: parts.message,
    source: context.source,
    fingerprint,
    occurrences: 1,
    createdAt: now,
    updatedAt: now,
  };
  if (parts.details) nextEntry.details = parts.details;
  if (parts.stackHead) nextEntry.stackHead = parts.stackHead;
  if (context.route) nextEntry.route = context.route;
  if (context.phase) nextEntry.phase = context.phase;
  if (parts.locationLabel) {
    nextEntry.locationLabel = parts.locationLabel;
  } else if (context.route) {
    nextEntry.locationLabel = context.route;
  }
  if (context.componentStack) nextEntry.componentStack = context.componentStack;
  commitRuntimeError(nextEntry);
  return nextEntry;
}

export function clearRuntimeError() {
  commitRuntimeError(null);
}

export function subscribeRuntimeError(listener: Listener) {
  listeners.add(listener);
  listener(currentEntry);
  return () => listeners.delete(listener);
}

import { createMiddleware } from "@tanstack/react-start";

/**
 * Middleware client-safe: o módulo pesado de servidor (node:fs, node:crypto,
 * cookies do request) é carregado dinamicamente somente dentro do handler,
 * evitando que ele entre no bundle do navegador.
 */
export const requirePanelAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { getPanelSessionFromRequest } = await import("./panel-auth.server");
  const session = getPanelSessionFromRequest();
  if (!session) {
    throw new Error("Unauthorized: Panel session not found");
  }

  return next({
    context: {
      userId: session.userId,
      claims: session,
      panelSession: session,
      isAdmin: session.role === "admin",
    },
  });
});

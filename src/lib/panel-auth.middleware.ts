import { createMiddleware } from "@tanstack/react-start";

/**
 * Middleware client-safe: o módulo pesado de servidor (node:fs, node:crypto,
 * cookies do request) é carregado dinamicamente somente dentro do handler,
 * evitando que ele entre no bundle do navegador.
 *
 * No laboratório (não-produção) a sessão é opcional: caímos no perfil admin
 * bootstrap para permitir testes diretos sem tela de login.
 */
export const requirePanelAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { getPanelSessionFromRequest, listPanelUsers, toSession } = await import("./panel-auth.server");

  let session = getPanelSessionFromRequest();

  if (!session) {
    const isProduction = process.env["NODE_ENV"] === "production";
    if (isProduction) {
      throw new Error("Unauthorized: Panel session not found");
    }

    const admin = listPanelUsers().find((user) => user.role === "admin");
    if (!admin) {
      throw new Error("Unauthorized: Panel session not found");
    }
    session = toSession(admin);
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

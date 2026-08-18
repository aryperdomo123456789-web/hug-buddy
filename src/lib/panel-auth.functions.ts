import { createServerFn } from "@tanstack/react-start";

import {
  clearPanelSessionCookie,
  getPanelSessionFromRequest,
  listPanelUsers,
  setPanelSessionCookie,
  updatePanelPassword,
  validatePanelCredentials,
  savePanelUser,
  type PanelRole,
} from "./panel-auth.server";

export const getCurrentPanelSession = createServerFn({ method: "GET" }).handler(async () => {
  return getPanelSessionFromRequest();
});

export const loginPanel = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const user = validatePanelCredentials(data.email, data.password);
    if (!user) {
      throw new Error("E-mail ou senha inválidos.");
    }

    setPanelSessionCookie(user);
    return { success: true, session: getPanelSessionFromRequest() };
  });

export const logoutPanel = createServerFn({ method: "POST" }).handler(async () => {
  clearPanelSessionCookie();
  return { success: true };
});

export const getPanelUsers = createServerFn({ method: "GET" }).handler(async () => listPanelUsers());

export const changePanelPassword = createServerFn({ method: "POST" })
  .validator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const session = getPanelSessionFromRequest();
    if (!session) {
      throw new Error("Sessão inválida.");
    }

    updatePanelPassword(session.userId, data.password);
    return { success: true };
  });

export const upsertPanelUser = createServerFn({ method: "POST" })
  .validator((d: { email: string; role: PanelRole; full_name: string | null; odin_reseller_id?: number | null; password?: string }) => d)
  .handler(async ({ data }) => {
    const session = getPanelSessionFromRequest();
    if (!session || session.role !== "admin") {
      throw new Error("Apenas o Dono pode criar ou editar usuários do painel.");
    }

    const user = savePanelUser({
      email: data.email,
      role: data.role,
      full_name: data.full_name,
      odin_reseller_id: data.odin_reseller_id ?? null,
      password: data.password,
    });

    if (data.password) {
      updatePanelPassword(user.id, data.password);
    }

    return { success: true, user };
  });

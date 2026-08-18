import { createServerFn } from "@tanstack/react-start";

import { requirePanelAuth, listPanelUsers, savePanelUser, updatePanelPassword } from "./panel-auth.server";

export const getSaasProfiles = createServerFn({ method: "GET" })
  .middleware([requirePanelAuth])
  .handler(async () => {
    return listPanelUsers().map((user) => ({
      id: user.id,
      full_name: user.full_name,
      role: user.role,
      odin_reseller_id: user.odin_reseller_id,
      email: user.email,
      updated_at: user.updatedAt,
    }));
  });

export const updateSaasProfile = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: any) => d)
  .handler(async ({ data, context }) => {
    if (!context.isAdmin && data.id !== context.userId) {
      throw new Error("Sem permissão para alterar este perfil.");
    }

    savePanelUser({
      id: data.id,
      email: String(data.email || data.full_name || "").trim() || context.panelSession.email,
      role: data.role || context.panelSession.role,
      full_name: data.full_name ?? null,
      odin_reseller_id: data.odin_reseller_id ?? null,
      password: data.password,
    });

    return { success: true };
  });

export const changePassword = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: { password: string }) => d)
  .handler(async ({ data, context }) => {
    updatePanelPassword(context.userId, data.password);
    return { success: true };
  });

export const createSaasUser = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: { email: string; role: "admin" | "reseller"; odin_reseller_id?: number }) => d)
  .handler(async ({ data, context }) => {
    if (!context.isAdmin) {
      throw new Error("Apenas administradores podem criar novos usuários.");
    }

    const user = savePanelUser({
      email: data.email,
      role: data.role,
      odin_reseller_id: data.odin_reseller_id ?? null,
      full_name: data.email,
      password: "12345678",
    });

    return {
      success: true,
      message: "Usuário do painel criado localmente com sucesso.",
      user,
    };
  });

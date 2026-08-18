import { createServerFn } from "@tanstack/react-start";

import { requirePanelAuth } from "./panel-auth.server";
import type { OdinProvisionScope } from "@/lib/odin-token.server";

async function assertAdmin(context: any) {
  if (!context.isAdmin) {
    throw new Error("Apenas o Dono pode gerenciar tokens de provisionamento.");
  }
}

export const getOdinProvisionTokens = createServerFn({ method: "GET" })
  .middleware([requirePanelAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const mod = await import("./odin-token.server");
    return mod.listProvisionTokens();
  });

export const createOdinProvisionToken = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: { name: string; scope: OdinProvisionScope; note?: string; expiresInDays?: number | null }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const mod = await import("./odin-token.server");
    const created = mod.createProvisionToken({
      name: data.name,
      scope: data.scope,
      note: data.note,
      createdBy: context.userId,
      expiresInDays: data.expiresInDays,
    });

    return {
      success: true,
      token: created.token,
      record: created.record,
    };
  });

export const revokeOdinProvisionToken = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const mod = await import("./odin-token.server");
    const revoked = mod.revokeProvisionToken(data.id);

    if (!revoked) {
      throw new Error("Token não encontrado.");
    }

    return { success: true, record: revoked };
  });

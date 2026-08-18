import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEFAULT_ADMIN_EMAIL = "mago@dono.com";
const DEFAULT_ADMIN_PASSWORD = "12345678";
const DEFAULT_ADMIN_NAME = "Mago Dono";

let bootstrapPromise: Promise<void> | null = null;

async function ensureProfileAndRole(userId: string) {
  const [{ error: profileError }, { error: roleError }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          role: "admin",
          full_name: DEFAULT_ADMIN_NAME,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      ),
    supabaseAdmin
      .from("user_roles")
      .upsert(
        {
          user_id: userId,
          role: "admin",
        },
        { onConflict: "user_id,role" },
      ),
  ]);

  if (profileError) throw profileError;
  if (roleError) throw roleError;
}

async function bootstrapDefaultAdmin() {
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) throw listError;

  const existing = listData.users.find((user) => user.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL);

  if (!existing) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEFAULT_ADMIN_NAME },
    });

    if (error) throw error;
    if (!data.user?.id) throw new Error("Falha ao criar o usuário Dono padrão.");

    await ensureProfileAndRole(data.user.id);
    return;
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
    password: DEFAULT_ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: DEFAULT_ADMIN_NAME },
  });

  if (updateError) throw updateError;

  await ensureProfileAndRole(existing.id);
}

export async function ensureDefaultAdminBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapDefaultAdmin().catch((error) => {
      console.error("[AuthBootstrap] Failed to bootstrap default admin:", error);
    });
  }

  return bootstrapPromise;
}

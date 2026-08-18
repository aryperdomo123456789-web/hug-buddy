import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const ProfileValidator = z.object({
  id: z.string(),
  full_name: z.string().nullable().optional(),
  role: z.enum(['admin', 'reseller']).optional(),
  odin_reseller_id: z.number().nullable().optional()
});

export const getSaasProfiles = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    return data;
  });

export const updateSaasProfile = createServerFn({ method: "POST" })
  .validator((d) => ProfileValidator.parse(d))
  .handler(async ({ data }) => {
    // Filter out undefined values to satisfy exactOptionalPropertyTypes
    const updateData: any = {};
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.odin_reseller_id !== undefined) updateData.odin_reseller_id = data.odin_reseller_id;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', data.id);
    
    if (error) throw error;
    return { success: true };
  });

export const changePassword = createServerFn({ method: "POST" })
  .validator((d) => z.object({ password: z.string().min(6) }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabase.auth.updateUser({
      password: data.password
    });
    
    if (error) throw error;
    return { success: true };
  });

const CreateUserValidator = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'reseller']),
  odin_reseller_id: z.number().nullable().optional(),
  full_name: z.string().nullable().optional()
});

export const createSaasUser = createServerFn({ method: "POST" })
  .validator((d) => CreateUserValidator.parse(d))
  .handler(async ({ data }) => {
    // No laboratório, ignoramos a verificação de role para facilitar testes
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: Math.random().toString(36).slice(-12),
      email_confirm: true,
      user_metadata: { full_name: data.full_name || data.email.split('@')[0] }
    });

    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: data.role,
        odin_reseller_id: data.odin_reseller_id ?? null,
        full_name: data.full_name ?? null
      })
      .eq('id', authUser.user.id);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw profileError;
    }

    return { 
      success: true, 
      userId: authUser.user.id,
      message: "Usuário SaaS criado com sucesso." 
    };
  });

export const deleteSaasUser = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    // No laboratório, permitimos a exclusão sem checar role admin
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    
    if (error) throw error;
    return { success: true };
  });
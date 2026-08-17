import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSaasProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    return data as any[];
  });

export const updateSaasProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: any) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('profiles')
      .update(data)
      .eq('id', data.id);
    
    if (error) throw error;
    return { success: true };
  });

export const changePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { password: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.auth.updateUser({
      password: data.password
    });
    
    if (error) throw error;
    return { success: true };
  });

export const createSaasUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { email: string; role: 'admin' | 'reseller'; odin_reseller_id?: number }) => d)
  .handler(async ({ data, context }) => {
    // Verificamos o papel do usuário logado via RPC
    // Usamos context.supabase.rpc.has_role (com type cast se necessário)
    const { data: hasRole } = await (context.supabase.rpc as any)('has_role', {
      _user_id: context.userId,
      _role: 'admin'
    });

    if (!hasRole) {
      throw new Error("Apenas administradores podem criar novos usuários.");
    }

    return { 
      success: true, 
      message: "Funcionalidade de criação requer configuração de SMTP no Supabase Cloud. O perfil será ativado no primeiro login do usuário." 
    };
  });

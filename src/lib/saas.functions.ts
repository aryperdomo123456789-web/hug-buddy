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
  .validator((d: { email: string; role: 'admin' | 'reseller'; odin_reseller_id?: number; full_name?: string }) => d)
  .handler(async ({ data, context }) => {
    // 1. Verificar se o executor é admin
    const { data: hasRole } = await (context.supabase.rpc as any)('has_role', {
      _user_id: context.userId,
      _role: 'admin'
    });

    if (!hasRole) {
      throw new Error("Apenas administradores podem criar novos usuários.");
    }

    // 2. Importar o cliente admin para criar o usuário no Auth
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    // 3. Criar usuário no Supabase Auth (gera uma senha aleatória que deve ser resetada pelo email ou login)
    // No Lovable Cloud, o signUp via admin costuma requerer confirmação se configurado.
    // Usamos admin.createUser para maior controle
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: Math.random().toString(36).slice(-12), // Senha temporária
      email_confirm: true,
      user_metadata: { full_name: data.full_name || data.email.split('@')[0] }
    });

    if (authError) throw authError;

    // 4. O trigger de perfil (se existir) cria o profile, mas vamos garantir os campos role e odin_reseller_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: data.role,
        odin_reseller_id: data.odin_reseller_id,
        full_name: data.full_name
      })
      .eq('id', authUser.user.id);

    if (profileError) {
      // Rollback auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw profileError;
    }

    return { 
      success: true, 
      userId: authUser.user.id,
      message: "Usuário SaaS criado com sucesso. Instrua o usuário a usar a recuperação de senha no primeiro acesso." 
    };
  });

export const deleteSaasUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    // 1. Verificar se o executor é admin
    const { data: hasRole } = await (context.supabase.rpc as any)('has_role', {
      _user_id: context.userId,
      _role: 'admin'
    });

    if (!hasRole) {
      throw new Error("Apenas administradores podem excluir usuários.");
    }

    // 2. Evitar auto-exclusão
    if (data.id === context.userId) {
      throw new Error("Você não pode excluir seu próprio perfil.");
    }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    // 3. Deletar do Auth (o cascade deve limpar o profile via trigger ou RLS se configurado)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    
    if (error) throw error;
    return { success: true };
  });

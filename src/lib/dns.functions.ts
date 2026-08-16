import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const getDnsConfigs = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("dns_configs")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
  });

export const createDnsConfig = createServerFn({ method: "POST" })
  .validator((d: { name: string; host: string; is_default?: boolean }) => d)
  .handler(async ({ data }) => {
    // Se for padrão, desativar outros padrões primeiro
    if (data.is_default) {
      await supabase
        .from("dns_configs")
        .update({ is_default: false })
        .eq("is_default", true);
    }
    
    const { data: result, error } = await supabase
      .from("dns_configs")
      .insert([data])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return result;
  });

export const updateDnsConfig = createServerFn({ method: "POST" })
  .validator((d: { id: string; name?: string; host?: string; is_default?: boolean }) => d)
  .handler(async ({ data }) => {
    const { id, ...updates } = data;
    
    if (updates.is_default) {
      await supabase
        .from("dns_configs")
        .update({ is_default: false })
        .eq("is_default", true);
    }
    
    const { data: result, error } = await supabase
      .from("dns_configs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return result;
  });

export const deleteDnsConfig = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("dns_configs")
      .delete()
      .eq("id", data.id);
    
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getDefaultDns = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("dns_configs")
      .select("host")
      .eq("is_default", true)
      .maybeSingle();
    
    return data?.host || null;
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePanelAuth } from "./panel-auth.middleware";
import { Plan } from "@/types/odin";

export const PlanValidator = z.object({
  id: z.string().optional().or(z.literal("")),
  name: z.string().min(1, "Nome é obrigatório"),
  odin_server_id: z.string().nullable().optional(),
  odin_package_id: z.number().nullable().optional(),
  bouquets: z.array(z.number()).default([]),
  connections: z.number().min(1).default(1),
  duration: z.number().min(1).default(1),
  duration_unit: z.enum(['minutes', 'hours', 'days', 'months', 'years']).default('months'),
  price: z.number().default(0),
  is_trial: z.boolean().default(false),
  has_adult_content: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
  sort_order: z.number().default(0),
  template: z.string().nullable().optional(),
  plan_price: z.number().nullable().optional(),
  pay_url: z.string().nullable().optional(),
  dns_host: z.string().nullable().optional(),
  can_gen_mag: z.boolean().default(true),
  can_gen_enigma: z.boolean().default(true),
  only_mag: z.boolean().default(false),
  only_enigma: z.boolean().default(false),
  lock_stb: z.boolean().default(false),
  is_restream: z.boolean().default(false),
  output_formats: z.array(z.string()).default(["m3u8", "ts"]),
});

const getDb = async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
};

export const getPlans = createServerFn({ method: "GET" })
  .middleware([requirePanelAuth])
  .handler(async () => {
    const supabase = await getDb();
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as Plan[];
  });

export const savePlan = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: any) => PlanValidator.parse(d))
  .handler(async ({ data }) => {
    const supabase = await getDb();
    const { id, ...saveData } = data;
    
    const sanitizedData: any = { ...saveData };
    Object.keys(sanitizedData).forEach((key) => {
      if (sanitizedData[key] === undefined) {
        sanitizedData[key] = null;
      }
    });

    if (id && id !== "") {
      const { error } = await supabase
        .from('plans')
        .update(sanitizedData)
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('plans')
        .insert(sanitizedData);
      if (error) throw error;
    }

    return { success: true };
  });

export const deletePlan = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: any) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = await getDb();
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', data.id);

    if (error) throw error;
    return { success: true };
  });

export const getAppSettings = createServerFn({ method: "GET" })
  .middleware([requirePanelAuth])
  .handler(async () => {
    const supabase = await getDb();
    const { data, error } = await supabase
      .from('app_settings')
      .select('*');

    if (error) throw error;
    
    const settings: Record<string, any> = {};
    (data || []).forEach((item: any) => {
      settings[item.key] = item.value;
    });
    
    return settings;
  });

const SettingsSchema = z.record(z.string(), z.any());

export const saveAppSettings = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: any) => SettingsSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = await getDb();
    
    for (const [key, value] of Object.entries(data)) {
      await supabase.from('app_settings').delete().eq('key', key);
      const { error } = await supabase
        .from('app_settings')
        .insert({ key, value: value as any });
      
      if (error) throw error;
    }
    
    return { success: true };
  });

export const saveAppSetting = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: any) => z.object({ key: z.string(), value: z.any() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = await getDb();
    await supabase.from('app_settings').delete().eq('key', data.key);
    const { error } = await supabase
      .from('app_settings')
      .insert({ key: data.key, value: data.value as any });

    if (error) throw error;
    return { success: true };
  });

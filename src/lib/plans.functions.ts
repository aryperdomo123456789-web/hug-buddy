import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { Plan } from "@/types/odin";

const PlanValidator = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  odin_server_id: z.string().nullable().optional(),
  odin_package_id: z.number().nullable().optional(),
  bouquets: z.array(z.number()).default([]),
  connections: z.number().int().min(1).default(1),
  duration: z.number().int().min(1).default(1),
  duration_unit: z.enum(['minutes', 'hours', 'days', 'months', 'years']).default('months'),
  price: z.number().min(0).default(0),
  is_trial: z.boolean().default(false),
  has_adult_content: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
  sort_order: z.number().int().default(0),
  template: z.string().nullable().optional(),
});

export const getPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data as Plan[];
  });

export const savePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => PlanValidator.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...saveData } = data;
    
    // Convert undefined to null for Supabase to satisfy exactOptionalPropertyTypes
    const sanitizedData: any = { ...saveData };
    Object.keys(sanitizedData).forEach(key => {
      if (sanitizedData[key] === undefined) {
        sanitizedData[key] = null;
      }
    });

    if (id) {
      const { error } = await context.supabase
        .from('plans')
        .update(sanitizedData)
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase
        .from('plans')
        .insert(sanitizedData);
      if (error) throw error;
    }
    
    return { success: true };
  });

export const deletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('plans')
      .delete()
      .eq('id', data.id);
    
    if (error) throw error;
    return { success: true };
  });

export const getAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('app_settings')
      .select('*');
    
    if (error) throw error;
    
    const settings: Record<string, any> = {};
    data?.forEach(s => {
      settings[s.key] = s.value;
    });
    
    return settings;
  });

export const saveAppSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ key: z.string(), value: z.any() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('app_settings')
      .upsert({ key: data.key, value: data.value });
    
    if (error) throw error;
    return { success: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { escapeSql } from "./odin";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { executeBatchQueries, executeQuery, parseOdinData } from "./odin.server";
import { z } from "zod";

export const getOdinFullData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: profile } = await context.supabase
        .from('profiles')
        .select('role, odin_reseller_id')
        .eq('id', context.userId)
        .single();

      const isAdmin = profile?.role === 'admin';
      const resellerId = profile?.odin_reseller_id;

      const userFilter = !isAdmin && resellerId ? ` WHERE created_by = ${resellerId}` : "";
      const resellerFilter = !isAdmin && resellerId ? ` WHERE id = ${resellerId} OR owner_id = ${resellerId}` : "";

      const queries = [
        `SELECT id, username, password, IFNULL(exp_date, 0), enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet, admin_notes, reseller_notes, allowed_ips, allowed_ua, forced_country, created_by FROM users${userFilter} ORDER BY id DESC LIMIT 100`,
        "SELECT id, stream_display_name, category_id, stream_icon, stream_source, 1 as stream_status FROM streams LIMIT 100",
        "SELECT id, bouquet_name FROM bouquets",
        "SELECT id, server_name, status, last_check_ago as last_check, server_hardware, total_clients, http_broadcast_port FROM streaming_servers",
        `SELECT id, username, password, email, owner_id, credits, status, member_group_id, IFNULL(last_login, 0), (SELECT count(*) FROM users WHERE created_by = reg_users.id) as user_count FROM reg_users${resellerFilter}`,
        "SELECT user_id, COUNT(*) as cons FROM user_activity_now GROUP BY user_id"
      ];

      const rawResults = await executeBatchQueries(queries);
      const data = parseOdinData(
        rawResults[0], 
        rawResults[1], 
        rawResults[2], 
        rawResults[3], 
        rawResults[4], 
        rawResults[5]
      );

      return { success: true, data };
    } catch (error: any) {
      console.error("[ServerFn] getOdinFullData Error:", error);
      return { success: false, error: error.message };
    }
  });

const ResellerValidator = z.object({
  id: z.number().optional(),
  username: z.string(),
  password: z.string(),
  email: z.string().email(),
  owner_id: z.number().default(1),
  credits: z.number().default(0),
  active: z.number().default(1),
  member_group_id: z.number().default(2),
});

export const createReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => ResellerValidator.parse(d))
  .handler(async ({ data }) => {
    try {
      const sql = `INSERT INTO reg_users (username, password, email, owner_id, credits, status, member_group_id) VALUES ('${escapeSql(data.username)}', '${escapeSql(data.password)}', '${escapeSql(data.email)}', ${data.owner_id}, ${data.credits}, ${data.active}, ${data.member_group_id})`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const updateReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => ResellerValidator.extend({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const sql = `UPDATE reg_users SET username='${escapeSql(data.username)}', password='${escapeSql(data.password)}', email='${escapeSql(data.email)}', owner_id=${data.owner_id}, credits=${data.credits}, status=${data.active}, member_group_id=${data.member_group_id} WHERE id=${data.id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const deleteReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: any) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const sql = `DELETE FROM reg_users WHERE id=${data.id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

const UserValidator = z.object({
  id: z.number().optional(),
  username: z.string(),
  password: z.string(),
  exp_date: z.number().optional(),
  enabled: z.number().default(1),
  admin_enabled: z.number().default(1),
  is_trial: z.number().default(0),
  is_restreamer: z.number().default(0),
  is_isplock: z.number().default(0),
  max_connections: z.number().default(1),
  bouquet: z.string().default("[]"),
  admin_notes: z.string().default(""),
  allowed_ips: z.string().default(""),
  allowed_ua: z.string().default(""),
  forced_country: z.string().default("Off"),
  owner_id: z.number().optional()
});

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => UserValidator.parse(d))
  .handler(async ({ data, context }) => {
    try {
      const { data: profile } = await context.supabase
        .from('profiles')
        .select('role, odin_reseller_id')
        .eq('id', context.userId)
        .single();

      const isAdmin = profile?.role === 'admin';
      const ownerId = isAdmin ? (data.owner_id || 1) : profile?.odin_reseller_id;

      const sql = `INSERT INTO users (username, password, exp_date, enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet, admin_notes, allowed_ips, allowed_ua, forced_country, created_by) VALUES ('${escapeSql(data.username)}', '${escapeSql(data.password)}', ${data.exp_date || 0}, ${data.enabled}, ${data.admin_enabled}, ${data.is_trial}, ${data.is_restreamer}, ${data.is_isplock}, ${data.max_connections}, '${escapeSql(data.bouquet)}', '${escapeSql(data.admin_notes)}', '${escapeSql(data.allowed_ips)}', '${escapeSql(data.allowed_ua)}', '${escapeSql(data.forced_country)}', ${ownerId})`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => UserValidator.extend({ id: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      const { data: profile } = await context.supabase
        .from('profiles')
        .select('role, odin_reseller_id')
        .eq('id', context.userId)
        .single();

      const isAdmin = profile?.role === 'admin';
      const resellerId = profile?.odin_reseller_id;

      if (!isAdmin) {
        const checkSql = `SELECT created_by FROM users WHERE id = ${data.id}`;
        const checkResult = await executeQuery(checkSql);
        if (Number(checkResult.trim()) !== resellerId) {
          throw new Error("Acesso negado.");
        }
      }

      const ownerId = isAdmin ? (data.owner_id || 1) : resellerId;
      const sql = `UPDATE users SET username='${escapeSql(data.username)}', password='${escapeSql(data.password)}', exp_date=${data.exp_date || 0}, enabled=${data.enabled}, admin_enabled=${data.admin_enabled}, is_trial=${data.is_trial}, is_restreamer=${data.is_restreamer}, is_isplock=${data.is_isplock}, max_connections=${data.max_connections}, bouquet='${escapeSql(data.bouquet)}', admin_notes='${escapeSql(data.admin_notes)}', allowed_ips='${escapeSql(data.allowed_ips)}', allowed_ua='${escapeSql(data.allowed_ua)}', forced_country='${escapeSql(data.forced_country)}', created_by=${ownerId} WHERE id=${data.id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      const { data: profile } = await context.supabase
        .from('profiles')
        .select('role, odin_reseller_id')
        .eq('id', context.userId)
        .single();

      if (profile?.role !== 'admin') {
        const checkSql = `SELECT created_by FROM users WHERE id = ${data.id}`;
        const checkResult = await executeQuery(checkSql);
        if (Number(checkResult.trim()) !== profile?.odin_reseller_id) {
          throw new Error("Acesso negado.");
        }
      }

      const sql = `DELETE FROM users WHERE id=${data.id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const toggleUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.number(), enabled: z.number() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const sql = `UPDATE users SET enabled=${data.enabled} WHERE id=${data.id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const killUserConnections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const sql = `DELETE FROM user_activity_now WHERE user_id=${data.id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const getInstallScript = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => `bash <(curl -sSL ${process.env['SITE_URL'] || 'https://id-preview--71a12a47-d6b3-4362-a2b3-4497a0a13af3.lovable.app'}/api/install)`);

export const getDeployCommand = createServerFn({ method: "GET" })
  .handler(async () => "git clone https://github.com/seu-repo/mago-panel.git && cd mago-panel && chmod +x deploy-aapanel.sh && ./deploy-aapanel.sh");

export const generateM3ULink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ username: z.string(), password: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: dnsConfig } = await context.supabase
      .from('dns_configs')
      .select('host')
      .eq('is_default', true)
      .maybeSingle();
    
    const domain = dnsConfig?.host || '23.158.72.30';
    const port = 7999;
    
    return `http://${domain}:${port}/get.php?username=${data.username}&password=${data.password}&type=m3u_plus&output=ts`;
  });

export const generateBashScript = (t: string, h: string) => `#!/bin/bash

# ODIN API INSTALLER
echo "Instalando Mago API no Odin Engine..."
mkdir -p /home/xtreamcodes/iptv_xtream_codes/mago-api
echo "${t}" > /home/xtreamcodes/iptv_xtream_codes/mago-api/token.txt
echo "Instalação concluída com sucesso!"
`;

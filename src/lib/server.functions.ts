import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { UserSchema, ResellerSchema } from "@/types/odin";
import { requirePanelAuth } from "./panel-auth.middleware";
import { escapeSql } from "./odin";

const getOdinServer = async () => import("./odin.server");

export const getOdinFullData = createServerFn({ method: "GET" })
  .middleware([requirePanelAuth])
  .handler(async ({ context }) => {
    console.log("[RPC] Starting getOdinFullData...");
    try {
      const { executeBatchQueries, parseOdinData } = await getOdinServer();
      const queries = [
        "SELECT id, username, password, IFNULL(exp_date, 0), enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet, admin_notes, reseller_notes, allowed_ips, allowed_ua, forced_country, created_by, '' as package_name FROM users ORDER BY id DESC",
        "SELECT id, stream_display_name, category_id, stream_icon, stream_source FROM streams ORDER BY id DESC",
        "SELECT id, bouquet_name FROM bouquets ORDER BY id DESC",
        "SELECT id, server_name, status, last_check_ago as last_check, server_hardware, total_clients, http_broadcast_port FROM streaming_servers ORDER BY id ASC",
        "SELECT id, username, password, email, owner_id, credits, status, member_group_id, IFNULL(last_login, 0), (SELECT count(*) FROM users WHERE created_by = reg_users.id) as user_count FROM reg_users ORDER BY id ASC",
        "SELECT user_id, COUNT(*) as cons FROM user_activity_now GROUP BY user_id",
        "SELECT server_id, COUNT(*) as conns, COUNT(DISTINCT user_id) as users, COUNT(DISTINCT stream_id) as streams FROM user_activity_now GROUP BY server_id",
        "SELECT stream_id, MAX(stream_status) as stream_status, SUM(bitrate) as bitrate_sum FROM streams_sys GROUP BY stream_id",
        "SELECT server_id, COUNT(*) as total_streams, SUM(stream_status = 1) as live_streams, SUM(stream_status = 0) as offline_streams, SUM(bitrate) as bitrate_sum, AVG(bitrate) as avg_bitrate FROM streams_sys GROUP BY server_id",
        "SELECT * FROM packages"
      ];


      const results = await executeBatchQueries(queries);
      console.log("[RPC] Queries executed. Results[0] sample:", (results[0] || "").substring(0, 50));
      
      if (!results || results.length < 5 || (!results[0] && !results[4])) {
        console.error("[RPC] No data found in key tables.");
        return { success: false, error: "Nenhum dado encontrado no servidor." };
      }
      
      const snapshot = parseOdinData(
        results[0] || "", results[1] || "", results[2] || "", results[3] || "", 
        results[4] || "", results[5] || "", results[6] || "", results[8] || "",
        results[9] || ""
      );

      
      return { success: true, data: snapshot };
    } catch (err: any) {
      console.error("[RPC] getOdinFullData critical error:", err);
      return { success: false, error: err.message };
    }
  });

export const quickCreateTestUser = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: any) => z.object({ planId: z.string(), overrideOwnerId: z.number().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { getPlans } = await import("./plans.functions");
    const plans = await getPlans();
    const plan = plans.find(p => p.id === data.planId);
    if (!plan) throw new Error("Plano não encontrado");

    const { executeQuery } = await getOdinServer();
    
    // Generate random 6-digit numeric credentials
    const username = Math.floor(100000 + Math.random() * 900000).toString();
    const password = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Duration calculation
    const now = Math.floor(Date.now() / 1000);
    let expDate = now;
    if (plan.duration_unit === 'minutes') expDate += plan.duration * 60;
    else if (plan.duration_unit === 'hours') expDate += plan.duration * 3600;
    else if (plan.duration_unit === 'days') expDate += plan.duration * 86400;
    else if (plan.duration_unit === 'months') expDate += plan.duration * 86400 * 30;
    else if (plan.duration_unit === 'years') expDate += plan.duration * 86400 * 365;

    const ownerId = data.overrideOwnerId || 1;
    const sql = `INSERT INTO users (username, password, created_by, max_connections, enabled, is_trial, exp_date, bouquet) 
                 VALUES ('${escapeSql(username)}', '${escapeSql(password)}', ${ownerId}, ${plan.connections}, 1, ${plan.is_trial ? 1 : 0}, ${expDate}, '${JSON.stringify(plan.bouquets)}')`;
    
    await executeQuery(sql);
    
    return { success: true, data: { username, password } };
  });

export const createUser = createServerFn({ method: "POST" })

  .middleware([requirePanelAuth])
  .validator((d: unknown) => UserSchema.parse(d))
  .handler(async ({ data, context }) => {
     const { executeQuery } = await getOdinServer();
     const sql = `INSERT INTO users (username, password, created_by, max_connections, enabled, is_trial) VALUES ('${escapeSql(data.username)}', '${escapeSql(data.password)}', ${data.owner_id}, ${data.max_connections}, ${data.enabled}, ${data.is_trial})`;
     await executeQuery(sql);
     return { success: true };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: unknown) => UserSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!data.id) throw new Error("ID requerido");
    const { executeQuery } = await getOdinServer();
    const sql = `UPDATE users SET username='${escapeSql(data.username)}', password='${escapeSql(data.password)}', max_connections=${data.max_connections}, enabled=${data.enabled}, is_trial=${data.is_trial} WHERE id=${data.id}`;
    await executeQuery(sql);
    return { success: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: any) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    const { executeQuery } = await getOdinServer();
    await executeQuery(`DELETE FROM users WHERE id=${data.id}`);
    return { success: true };
  });

export const killUserConnections = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: any) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    const { executeQuery } = await getOdinServer();
    await executeQuery(`DELETE FROM user_activity_now WHERE user_id=${data.id}`);
    return { success: true };
  });

export const toggleUserStatus = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: any) => z.object({ id: z.number(), enabled: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    const { executeQuery } = await getOdinServer();
    await executeQuery(`UPDATE users SET enabled=${data.enabled} WHERE id=${data.id}`);
    return { success: true };
  });

export const createReseller = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: unknown) => ResellerSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { executeQuery } = await getOdinServer();
    const sql = `INSERT INTO reg_users (username, password, email, owner_id, credits, status) VALUES ('${escapeSql(data.username)}', '${escapeSql(data.password)}', '${escapeSql(data.email)}', ${data.owner_id}, ${data.credits}, ${data.active})`;
    await executeQuery(sql);
    return { success: true };
  });

export const updateReseller = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: unknown) => ResellerSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!data.id) throw new Error("ID requerido");
    const { executeQuery } = await getOdinServer();
    const sql = `UPDATE reg_users SET username='${escapeSql(data.username)}', password='${escapeSql(data.password)}', email='${escapeSql(data.email)}', credits=${data.credits}, status=${data.active} WHERE id=${data.id}`;
    await executeQuery(sql);
    return { success: true };
  });

export const deleteReseller = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: any) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    const { executeQuery } = await getOdinServer();
    await executeQuery(`DELETE FROM reg_users WHERE id=${data.id}`);
    return { success: true };
  });

export const getOdinConfigSnapshot = createServerFn({ method: "GET" })
  .middleware([requirePanelAuth])
  .handler(async () => {
    const { getOdinRuntimeConfig } = await import("./odin-runtime.server");
    return getOdinRuntimeConfig();
  });

export const saveOdinConfig = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .validator((d: any) => z.object({ data: z.any() }).parse(d))
  .handler(async ({ data: { data }, context }) => {
    const { saveOdinRuntimeConfig } = await import("./odin-runtime.server");
    const saved = saveOdinRuntimeConfig(data ?? {});
    return { success: true, data: saved };
  });

export const seedActiveOdinConfig = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .handler(async () => {
    const { getOdinConfig } = await import("./odin");
    const current = getOdinConfig();
    const { saveOdinRuntimeConfig } = await import("./odin-runtime.server");
    const saved = saveOdinRuntimeConfig(current);
    return { success: true, data: saved };
  });

export const testOdinConnection = createServerFn({ method: "GET" })
  .middleware([requirePanelAuth])
  .handler(async () => {
    const { executeQuery } = await getOdinServer();
    const res = await executeQuery("SELECT COUNT(*) FROM users");
    return { success: true, data: { usersCount: parseInt(res) || 0 } };
  });

export const generateM3ULink = createServerFn({ method: "POST" })
  .validator((d: any) => z.object({ username: z.string(), password: z.string() }).parse(d))
  .handler(async ({ data }) => {
     const origin = "http://localhost:8080";
     return `${origin}/get.php?username=${data.username}&password=${data.password}&type=m3u_plus&output=mpegts`;
  });

export const generateBashScript = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .handler(async () => {
    return `#!/bin/bash\necho "Mago Panel API Active"`;
  });

export { getPlans, savePlan, deletePlan, getAppSettings, saveAppSettings } from "./plans.functions";

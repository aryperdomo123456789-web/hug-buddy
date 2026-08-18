import { createServerFn } from "@tanstack/react-start";
import { NodeSSH } from "node-ssh";
import { escapeSql, getOdinConfig } from "./odin";
import { requirePanelAuth } from "./panel-auth.server";
export { getPlans, savePlan, deletePlan, getAppSettings, saveAppSetting } from "./plans.functions";
import type { User, Reseller } from "@/types/odin";

/**
 * ODIN INFRASTRUCTURE CONFIGURATION
 * Fetches config from central odin.ts utility
 */
async function getConfig() {
  const mod = await import("./odin-runtime.server");
  return mod.getOdinRuntimeConfig();
}

type PanelContext = {
  isAdmin: boolean;
  panelSession: {
    userId: string;
    role: "admin" | "reseller";
    odin_reseller_id: number | null;
  };
};

function toQueryInt(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error("ID inválido.");
  }
  return Math.trunc(num);
}

function toFiniteNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(/,/g, ".").replace(/[^0-9.+-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function safeParseJson(value: unknown): Record<string, unknown> {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    return JSON.parse(value.trim()) as Record<string, unknown>;
  } catch {
    try {
      return JSON.parse(value.replace(/\r/g, "").replace(/\n/g, "")) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}

function normalizeLegacyId<T extends Record<string, unknown>>(record: T, idValue: unknown): T & { M_ID: number; m_id: number } {
  const id = toFiniteNumber(idValue);
  return {
    ...record,
    M_ID: id,
    m_id: id,
  };
}

function normalizeBouquetPayload(value: unknown): string {
  if (typeof value === "string") {
    return value.trim() || "[]";
  }

  if (Array.isArray(value)) {
    const ids = value
      .map((item) => {
        if (item && typeof item === "object") {
          const candidate = item as Record<string, unknown>;
          return toFiniteNumber(candidate["id"] ?? candidate["M_ID"] ?? candidate["m_id"]);
        }
        return toFiniteNumber(item);
      })
      .filter((id) => id > 0);
    return JSON.stringify(ids);
  }

  if (value && typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    const ids = [
      candidate["id"],
      candidate["M_ID"],
      candidate["m_id"],
    ]
      .map((item) => toFiniteNumber(item))
      .filter((id) => id > 0);
    return JSON.stringify(ids);
  }

  return "[]";
}

async function readCustomerOwnerId(id: number): Promise<number | null> {
  const raw = await executeQuery(`SELECT created_by FROM users WHERE id=${id} LIMIT 1`);
  const value = raw.trim().split(/\r?\n/).find(Boolean);
  if (!value) return null;
  const owner = Number(value.trim());
  return Number.isFinite(owner) ? owner : null;
}

function ensureResellerScope(context: PanelContext): number {
  const resellerId = context.panelSession.odin_reseller_id;
  if (resellerId == null) {
    throw new Error("Esta conta SaaS não está vinculada a uma revenda Odin.");
  }
  return resellerId;
}

function filterCustomersForContext<T extends { owner_id: number }>(customers: T[], context: PanelContext): T[] {
  if (context.isAdmin) return customers;
  const resellerId = context.panelSession.odin_reseller_id;
  if (resellerId == null) return [];
  return customers.filter((customer) => customer.owner_id === resellerId);
}

function filterResellersForContext<T extends { id: number }>(resellers: T[], context: PanelContext): T[] {
  if (context.isAdmin) return resellers;
  const resellerId = context.panelSession.odin_reseller_id;
  if (resellerId == null) return [];
  return resellers.filter((reseller) => reseller.id === resellerId);
}

async function assertCustomerWriteAccess(context: PanelContext, id: number): Promise<number> {
  if (context.isAdmin) return id;
  const resellerId = ensureResellerScope(context);
  const ownerId = await readCustomerOwnerId(id);
  if (ownerId == null) {
    throw new Error("Cliente não encontrado.");
  }
  if (ownerId !== resellerId) {
    throw new Error("Sem permissão para alterar este cliente.");
  }
  return ownerId;
}

function assertAdminOnly(context: PanelContext): void {
  if (!context.isAdmin) {
    throw new Error("Apenas o Dono pode executar esta ação.");
  }
}

/**
 * UTILITY: Execute multiple MySQL queries via a single SSH session
 * Optimized for serverless environments with aggressive timeouts
 */
async function executeBatchQueries(queries: string[]) {
  const cfg = await getConfig();
  const ssh = new NodeSSH();
  
  try {
    console.log(`[SSH] Connecting to ${cfg.sshHost}...`);
    
    await ssh.connect({
      host: cfg.sshHost,
      port: cfg.sshPort,
      username: cfg.sshUsername,
      password: cfg.sshPassword,
      readyTimeout: 30000,
      keepaliveInterval: 5000,
      compress: true,
    });
    
    const results: string[] = [];
    for (let i = 0; i < queries.length; i++) {
      const sql = queries[i] || "";
      if (!sql) {
        results.push("");
        continue;
      }
      const mysqlCmd = `mysql -h 127.0.0.1 -P ${cfg.dbPort} -u ${cfg.dbUsername} -p'${cfg.dbPassword}' ${cfg.dbName} -N -s -e "${sql}"`;
      
      const result = await ssh.execCommand(mysqlCmd);
      console.log(`[SSH] Executed query ${i} (length: ${result.stdout.length})`);
      
      if (result.code !== 0) {
        console.error(`[SSH] Query ${i} Failed: ${result.stderr}`);
        results.push(""); 
      } else {
        results.push(result.stdout.replace(/\r/g, "") || "");
      }
    }
    
    ssh.dispose();
    return results;
  } catch (error: any) {
    console.error(`[SSH] Batch Critical Failure:`, error.message);
    try { if (ssh.isConnected()) ssh.dispose(); } catch (e) {}
    return queries.map(() => "");
  }
}

async function executeQuery(sql: string): Promise<string> {
  const results = await executeBatchQueries([sql]);
  return results[0] || "";
}

export const getOdinFullData = createServerFn({ method: "GET" })
  .middleware([requirePanelAuth])
  .handler(async ({ context }) => {
    try {
      const queries = [
        "SELECT id, username, password, IFNULL(exp_date, 0), enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet, admin_notes, reseller_notes, allowed_ips, allowed_ua, forced_country, created_by, (SELECT package_name FROM packages WHERE id = users.package_id LIMIT 1) as package_name FROM users ORDER BY id DESC",
        "SELECT id, stream_display_name, category_id, stream_icon, stream_source FROM streams ORDER BY id DESC",
        "SELECT id, bouquet_name FROM bouquets ORDER BY id DESC",
        "SELECT id, server_name, status, last_check_ago as last_check, server_hardware, total_clients, http_broadcast_port FROM streaming_servers ORDER BY id ASC",
        "SELECT id, username, password, email, owner_id, credits, status, member_group_id, IFNULL(last_login, 0), (SELECT count(*) FROM users WHERE created_by = reg_users.id) as user_count FROM reg_users ORDER BY id ASC",
        "SELECT user_id, COUNT(*) as cons FROM user_activity_now GROUP BY user_id",
        "SELECT server_id, COUNT(*) as conns, COUNT(DISTINCT user_id) as users, COUNT(DISTINCT stream_id) as streams FROM user_activity_now GROUP BY server_id",
        "SELECT stream_id, MAX(stream_status) as stream_status, SUM(bitrate) as bitrate_sum FROM streams_sys GROUP BY stream_id",
        "SELECT server_id, COUNT(*) as total_streams, SUM(stream_status = 1) as live_streams, SUM(stream_status = 0) as offline_streams, SUM(bitrate) as bitrate_sum, AVG(bitrate) as avg_bitrate FROM streams_sys GROUP BY server_id"
      ];

      const [uRaw, stRaw, bRaw, svRaw, rRaw, actRaw, srvActRaw, streamStatusRaw, serverStateRaw] = await executeBatchQueries(queries);

      const activityMap: Record<number, number> = {};
      (actRaw || "").trim().split("\n").filter(Boolean).forEach(line => {
        const [uid, count] = line.split("\t");
        if (uid) activityMap[Number(uid)] = Number(count || 0);
      });

      const serverActivityMap: Record<number, { conns: number; users: number; streams: number }> = {};
      (srvActRaw || "").trim().split("\n").filter(Boolean).forEach((line) => {
        const [serverId, conns, users, streams] = line.split("\t");
        if (!serverId) return;
        serverActivityMap[Number(serverId)] = {
          conns: Number(conns || 0),
          users: Number(users || 0),
          streams: Number(streams || 0),
        };
      });

      const streamStatusMap: Record<number, { status: number; bitrate: number }> = {};
      (streamStatusRaw || "").trim().split("\n").filter(Boolean).forEach((line) => {
        const [streamId, streamStatus, bitrateSum] = line.split("\t");
        if (!streamId) return;
        streamStatusMap[Number(streamId)] = {
          status: Number(streamStatus || 0),
          bitrate: Number(bitrateSum || 0),
        };
      });

      const serverStateMap: Record<number, { total: number; live: number; offline: number; bitrate: number; avgBitrate: number }> = {};
      (serverStateRaw || "").trim().split("\n").filter(Boolean).forEach((line) => {
        const [serverId, total, live, offline, bitrateSum, avgBitrate] = line.split("\t");
        if (!serverId) return;
        serverStateMap[Number(serverId)] = {
          total: Number(total || 0),
          live: Number(live || 0),
          offline: Number(offline || 0),
          bitrate: Number(bitrateSum || 0),
          avgBitrate: Number(avgBitrate || 0),
        };
      });

      const customers = (uRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const parts = line.split("\t");
        if (parts.length < 17) return null;
        
        const [
          id, username, password, exp_date, enabled, admin_enabled, 
          is_trial, is_restreamer, is_isplock, max_connections, 
          bouquet, admin_notes, reseller_notes, allowed_ips, 
          allowed_ua, forced_country, owner_id, package_name
        ] = parts;
        
        return normalizeLegacyId({
          id: Number(id),
          username: username || "",
          password: password || "",
          exp_date: exp_date === "NULL" ? 0 : Number(exp_date || 0),
          enabled: Number(enabled || 0),
          admin_enabled: Number(admin_enabled || 0),
          is_trial: Number(is_trial || 0),
          is_restreamer: Number(is_restreamer || 0),
          is_isplock: Number(is_isplock || 0),
          max_connections: Number(max_connections || 0),
          bouquet: normalizeBouquetPayload(bouquet),
          admin_notes: admin_notes || "",
          reseller_notes: reseller_notes || "",
          allowed_ips: allowed_ips || "",
          allowed_ua: allowed_ua || "",
          forced_country: forced_country || "Off",
          active_cons: activityMap[Number(id)] || 0,
          owner_id: Number(owner_id || 1),
          package_name: package_name || undefined,
        }, id);
      }).filter((x): x is (User & { M_ID: number; m_id: number }) => x !== null && typeof x.id === 'number');

      const streams = (stRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const [id, name, cat, icon, source] = line.split("\t");
        const streamId = Number(id || 0);
        const streamState = streamStatusMap[streamId] || { status: 0, bitrate: 0 };
        return normalizeLegacyId({
          id: streamId,
          name: name || "Stream",
          category_id: Number(cat || 0),
          icon: icon || "",
          source: source || "",
          status: streamState.status,
          bitrate_mbps: streamState.bitrate ? streamState.bitrate / 1000 : 0,
        }, streamId);
      });

      const bouquets = (bRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const [id, name] = line.split("\t");
        return normalizeLegacyId({ id: Number(id), name: name || "Bouquet" }, id);
      });

      const servers = (svRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const [id, name, status, last, hardware, clients, port] = line.split("\t");
        const hwData = safeParseJson(hardware);
        const serverId = Number(id || 0);
        const activity = serverActivityMap[serverId] || { conns: 0, users: 0, streams: 0 };
        const streamState = serverStateMap[serverId] || { total: 0, live: 0, offline: 0, bitrate: 0, avgBitrate: 0 };
        const bytesSent = toFiniteNumber(hwData["bytes_sent"]);
        const bytesReceived = toFiniteNumber(hwData["bytes_received"]);
        const avgBitrate = toFiniteNumber(streamState.avgBitrate);
        const outputMbps = toFiniteNumber(streamState.bitrate) / 1000;
        const serverName = name || "Server";
        const isMainServer = serverId === 1 || /main/i.test(serverName);
        
        return normalizeLegacyId({
          id: id || "0",
          name: serverName,
          status: Number(status || 0),
          last_check: Number(last || 0),
          hardware: hwData,
          total_clients: Number(clients || 0),
          port: port || "80",
          live_connections: activity.conns,
          live_users: activity.users,
          live_streams: streamState.live || activity.streams,
          offline_streams: streamState.offline,
          total_streams: streamState.total,
          input_mbps: isMainServer ? avgBitrate : 0,
          output_mbps: outputMbps || avgBitrate,
          avg_bitrate_mbps: avgBitrate,
          bytes_sent: bytesSent,
          bytes_received: bytesReceived,
          network_speed: hwData["network_speed"] ?? hwData["network"] ?? ""
        }, id);
      });

      const resellers = (rRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const parts = line.split("\t");
        if (parts.length < 10) return null;
        const [id, username, password, email, owner_id, credits, status, member_group_id, last_login, user_count] = parts;

        return normalizeLegacyId({
          id: Number(id),
          username: username || "",
          password: password || "",
          email: email || "",
          owner_id: Number(owner_id || 0),
          credits: Number(credits || 0),
          active: Number(status || 1),
          member_group_id: Number(member_group_id || 2),
          last_login: last_login === "NULL" ? 0 : Number(last_login || 0),
          user_count: Number(user_count || 0)
        }, id);
      }).filter((x): x is (Reseller & { M_ID: number; m_id: number }) => x !== null && typeof x.id === 'number');

      const scopedCustomers = filterCustomersForContext(customers, context as PanelContext);
      const scopedResellers = filterResellersForContext(resellers, context as PanelContext);

      console.log(`[SSH] Processed ${scopedCustomers.length} customers and ${scopedResellers.length} resellers`);

      return {
        success: true,
        data: { customers: scopedCustomers, streams, bouquets, servers, resellers: scopedResellers }
      } as { success: true; data: any };

    } catch (error: any) {
      return { success: false, error: error.message } as { success: false; error: string };
    }
  });

export const getOdinConfigSnapshot = createServerFn({ method: "GET" })
  .middleware([requirePanelAuth])
  .handler(async () => {
    const { getOdinRuntimeConfig } = await import("./odin-runtime.server");
    return getOdinRuntimeConfig();
  });

export const saveOdinConfig = createServerFn({ method: "POST" })
  .validator((d: any) => ({ data: d }))
  .middleware([requirePanelAuth])
  .handler(async ({ data: { data }, context }) => {
    assertAdminOnly(context as PanelContext);
    const { saveOdinRuntimeConfig } = await import("./odin-runtime.server");
    const saved = saveOdinRuntimeConfig(data ?? {});
    return { success: true, data: saved } as { success: true; data: any };
  });

export const seedActiveOdinConfig = createServerFn({ method: "POST" })
  .middleware([requirePanelAuth])
  .handler(async ({ context }) => {
    assertAdminOnly(context as PanelContext);
    const current = getOdinConfig();
    const { saveOdinRuntimeConfig } = await import("./odin-runtime.server");
    const saved = saveOdinRuntimeConfig(current);
    return { success: true, data: saved } as { success: true; data: any };
  });

export const testOdinConnection = createServerFn({ method: "GET" })
  .middleware([requirePanelAuth])
  .handler(async ({ context }) => {
    assertAdminOnly(context as PanelContext);
    const cfg = await getConfig();
    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host: cfg.sshHost,
        port: cfg.sshPort,
        username: cfg.sshUsername,
        password: cfg.sshPassword,
        readyTimeout: 20000,
        keepaliveInterval: 5000,
        compress: true,
      });

      const result = await ssh.execCommand(
        `mysql -h 127.0.0.1 -P ${cfg.dbPort} -u ${cfg.dbUsername} -p'${cfg.dbPassword}' ${cfg.dbName} -N -s -e "SELECT COUNT(*) FROM users"`,
      );

      ssh.dispose();

      if (result.code !== 0) {
        return {
          success: false,
          error: (result.stderr || "MySQL query failed") as string,
        } as { success: false; error: string };
      }

      return {
        success: true,
        data: {
          usersCount: Number(result.stdout.trim() || 0),
          sshHost: cfg.sshHost,
          dbHost: cfg.dbHost,
          dbName: cfg.dbName,
        },
      } as { success: true; data: any };
    } catch (error: any) {
      try { if (ssh.isConnected()) ssh.dispose(); } catch {}
      return { success: false, error: (error?.message || String(error)) as string } as { success: false; error: string };
    }
  });

export const createReseller = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .middleware([requirePanelAuth])
  .handler(async ({ data, context }) => {
    try {
      assertAdminOnly(context as PanelContext);
      const sql = `INSERT INTO reg_users (username, password, email, owner_id, credits, status, member_group_id) VALUES ('${escapeSql(data.username)}', '${escapeSql(data.password)}', '${escapeSql(data.email)}', ${Number(data.owner_id || 0)}, ${Number(data.credits || 0)}, ${Number(data.active || 1)}, ${Number(data.member_group_id || 2)})`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const updateReseller = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .middleware([requirePanelAuth])
  .handler(async ({ data, context }) => {
    try {
      assertAdminOnly(context as PanelContext);
      const sql = `UPDATE reg_users SET username='${escapeSql(data.username)}', password='${escapeSql(data.password)}', email='${escapeSql(data.email)}', owner_id=${Number(data.owner_id || 0)}, credits=${Number(data.credits || 0)}, status=${Number(data.active || 1)}, member_group_id=${Number(data.member_group_id || 2)} WHERE id=${Number(data.id)}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const deleteReseller = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .middleware([requirePanelAuth])
  .handler(async ({ data, context }) => {
    try {
      assertAdminOnly(context as PanelContext);
      const sql = `DELETE FROM reg_users WHERE id=${data.id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const createUser = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .middleware([requirePanelAuth])
  .handler(async ({ data, context }) => {
    try {
      const panel = context as PanelContext;
      const ownerId = panel.isAdmin ? Number(data.owner_id || 1) : ensureResellerScope(panel);
      const scopedSql = `INSERT INTO users (username, password, exp_date, enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet, admin_notes, allowed_ips, allowed_ua, forced_country, created_by) VALUES ('${escapeSql(data.username)}', '${escapeSql(data.password)}', ${Number(data.exp_date)}, ${Number(data.enabled)}, ${Number(data.admin_enabled)}, ${Number(data.is_trial)}, ${Number(data.is_restreamer)}, ${Number(data.is_isplock)}, ${Number(data.max_connections || 1)}, '${escapeSql(data.bouquet || "[]")}', '${escapeSql(data.admin_notes || "")}', '${escapeSql(data.allowed_ips || "")}', '${escapeSql(data.allowed_ua || "")}', '${escapeSql(data.forced_country || "Off")}', ${ownerId})`;
      await executeQuery(scopedSql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const updateUser = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .middleware([requirePanelAuth])
  .handler(async ({ data, context }) => {
    try {
      const panel = context as PanelContext;
      const id = toQueryInt(data.id);
      let createdBy = Number(data.owner_id || 1);

      if (!panel.isAdmin) {
        createdBy = await assertCustomerWriteAccess(panel, id);
      }

      const sql = `UPDATE users SET username='${escapeSql(data.username)}', password='${escapeSql(data.password)}', exp_date=${Number(data.exp_date)}, enabled=${Number(data.enabled)}, admin_enabled=${Number(data.admin_enabled)}, is_trial=${Number(data.is_trial)}, is_restreamer=${Number(data.is_restreamer)}, is_isplock=${Number(data.is_isplock)}, max_connections=${Number(data.max_connections || 1)}, bouquet='${escapeSql(data.bouquet || "[]")}', admin_notes='${escapeSql(data.admin_notes || "")}', allowed_ips='${escapeSql(data.allowed_ips || "")}', allowed_ua='${escapeSql(data.allowed_ua || "")}', forced_country='${escapeSql(data.forced_country || "Off")}', created_by=${panel.isAdmin ? Number(data.owner_id || createdBy) : createdBy} WHERE id=${id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const deleteUser = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .middleware([requirePanelAuth])
  .handler(async ({ data, context }) => {
    try {
      const panel = context as PanelContext;
      const id = toQueryInt(data.id);
      if (!panel.isAdmin) {
        await assertCustomerWriteAccess(panel, id);
      }
      const sql = `DELETE FROM users WHERE id=${id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const toggleUserStatus = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .middleware([requirePanelAuth])
  .handler(async ({ data, context }) => {
    try {
      const panel = context as PanelContext;
      const id = toQueryInt(data.id);
      if (!panel.isAdmin) {
        await assertCustomerWriteAccess(panel, id);
      }
      const sql = `UPDATE users SET enabled=${Number(data.enabled)} WHERE id=${id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const killUserConnections = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .middleware([requirePanelAuth])
  .handler(async ({ data, context }) => {
    try {
      const panel = context as PanelContext;
      const id = toQueryInt(data.id);
      if (!panel.isAdmin) {
        await assertCustomerWriteAccess(panel, id);
      }
      const sql = `DELETE FROM user_activity_now WHERE user_id=${id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const getInstallScript = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getOdinRuntimeConfig } = await import("./odin-runtime.server");
    const cfg = getOdinRuntimeConfig();
    return generateBashScript(cfg.apiToken, cfg.sshHost);
  });

export const getDeployCommand = createServerFn({ method: "GET" })
  .handler(async () => "git clone https://github.com/seu-repo/mago-panel.git && cd mago-panel && chmod +x deploy-aapanel.sh && ./deploy-aapanel.sh");

export const generateM3ULink = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .middleware([requirePanelAuth])
  .handler(async ({ data }) => {
    const cfg = await getConfig();
    const domain = cfg.dbHost || cfg.sshHost || "localhost";
    const port = 80;
    return `http://${domain}:${port}/get.php?username=${escapeSql(data.username)}&password=${escapeSql(data.password)}&type=m3u_plus&output=ts`;
  });


export const generateBashScript = (t: string, h: string) => `#!/bin/bash

# ODIN API INSTALLER
echo "Instalando Mago API no Odin Engine..."
mkdir -p /home/xtreamcodes/iptv_xtream_codes/mago-api
echo "${t}" > /home/xtreamcodes/iptv_xtream_codes/mago-api/token.txt
echo "Instalação concluída com sucesso!"
`;

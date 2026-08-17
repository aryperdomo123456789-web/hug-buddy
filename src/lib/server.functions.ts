import { createServerFn } from "@tanstack/react-start";
import { NodeSSH } from "node-ssh";
import { getOdinConfig, escapeSql } from "./odin";

/**
 * ODIN INFRASTRUCTURE CONFIGURATION
 * Fetches config from central odin.ts utility
 */
const getConfig = () => getOdinConfig();

/**
 * UTILITY: Execute multiple MySQL queries via a single SSH session
 * Optimized for serverless environments with aggressive timeouts
 */
async function executeBatchQueries(queries: string[]) {
  const cfg = getConfig();
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
  .handler(async () => {
    try {
      const queries = [
        "SELECT id, username, password, IFNULL(exp_date, 0), enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet, admin_notes, reseller_notes, allowed_ips, allowed_ua, forced_country, created_by FROM users ORDER BY id DESC LIMIT 100",
        "SELECT id, stream_display_name, category_id, stream_icon, stream_source, 1 as stream_status FROM streams LIMIT 100",
        "SELECT id, bouquet_name FROM bouquets",
        "SELECT id, server_name, status, last_check_ago as last_check, server_hardware, total_clients, http_broadcast_port FROM streaming_servers",
        "SELECT id, username, password, email, owner_id, credits, status, member_group_id, IFNULL(last_login, 0), (SELECT count(*) FROM users WHERE created_by = reg_users.id) as user_count FROM reg_users",
        "SELECT user_id, COUNT(*) as cons FROM user_activity_now GROUP BY user_id"
      ];

      const [uRaw, stRaw, bRaw, svRaw, rRaw, actRaw] = await executeBatchQueries(queries);

      const activityMap: Record<number, number> = {};
      (actRaw || "").trim().split("\n").filter(Boolean).forEach(line => {
        const [uid, count] = line.split("\t");
        if (uid) activityMap[Number(uid)] = Number(count || 0);
      });

      const customers = (uRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const parts = line.split("\t");
        if (parts.length < 17) return null;
        
        const [
          id, username, password, exp_date, enabled, admin_enabled, 
          is_trial, is_restreamer, is_isplock, max_connections, 
          bouquet, admin_notes, reseller_notes, allowed_ips, 
          allowed_ua, forced_country, owner_id
        ] = parts;
        
        return {
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
          bouquet: bouquet || "[]",
          admin_notes: admin_notes || "",
          reseller_notes: reseller_notes || "",
          allowed_ips: allowed_ips || "",
          allowed_ua: allowed_ua || "",
          forced_country: forced_country || "Off",
          active_cons: activityMap[Number(id)] || 0,
          owner_id: Number(owner_id || 1)
        };
      }).filter(Boolean);

      const streams = (stRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const [id, name, cat, icon, source, status] = line.split("\t");
        return { 
          id: Number(id), 
          name: name || "Stream", 
          category_id: Number(cat || 0), 
          icon: icon || "", 
          source: source || "", 
          status: Number(status || 0) 
        };
      });

      const bouquets = (bRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const [id, name] = line.split("\t");
        return { id: Number(id), name: name || "Bouquet" };
      });

      const servers = (svRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const [id, name, status, last, hardware, clients, port] = line.split("\t");
        let hwData = {};
        try { 
          const sanitizedHw = hardware ? hardware.replace(/\\n/g, "").replace(/\\/g, "") : "{}";
          hwData = JSON.parse(sanitizedHw); 
        } catch(err) {
          console.error("Hardware Parse Error", name);
        }
        
        return { 
          id: id || "0", 
          name: name || "Server", 
          status: Number(status || 0), 
          last_check: Number(last || 0),
          hardware: hwData,
          total_clients: Number(clients || 0),
          port: port || "80"
        };
      });

      const resellers = (rRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const parts = line.split("\t");
        if (parts.length < 10) return null;
        const [id, username, password, email, owner_id, credits, status, mg_id, last_login, user_count] = parts;

        return {
          id: Number(id),
          username: username || "",
          password: password || "",
          email: email || "",
          owner_id: Number(owner_id || 0),
          credits: Number(credits || 0),
          active: Number(status || 1),
          member_group_id: Number(mg_id || 2),
          last_login: last_login === "NULL" ? 0 : Number(last_login || 0),
          user_count: Number(user_count || 0)
        };
      }).filter(Boolean);

      console.log(`[SSH] Processed ${customers.length} customers and ${resellers.length} resellers`);

      return { 
        success: true, 
        data: { customers, streams, bouquets, servers, resellers } 
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

export const createReseller = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    try {
      const sql = `INSERT INTO reg_users (username, password, email, owner_id, credits, status, member_group_id) VALUES ('${escapeSql(data.username)}', '${escapeSql(data.password)}', '${escapeSql(data.email)}', ${Number(data.owner_id || 0)}, ${Number(data.credits || 0)}, ${Number(data.active || 1)}, ${Number(data.member_group_id || 2)})`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const updateReseller = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    try {
      const sql = `UPDATE reg_users SET username='${escapeSql(data.username)}', password='${escapeSql(data.password)}', email='${escapeSql(data.email)}', owner_id=${Number(data.owner_id || 0)}, credits=${Number(data.credits || 0)}, status=${Number(data.active || 1)}, member_group_id=${Number(data.member_group_id || 2)} WHERE id=${Number(data.id)}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const deleteReseller = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    try {
      const sql = `DELETE FROM reg_users WHERE id=${data.id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const createUser = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    try {
      const sql = `INSERT INTO users (username, password, exp_date, enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet, admin_notes, allowed_ips, allowed_ua, forced_country, created_by) VALUES ('${escapeSql(data.username)}', '${escapeSql(data.password)}', ${Number(data.exp_date)}, ${Number(data.enabled)}, ${Number(data.admin_enabled)}, ${Number(data.is_trial)}, ${Number(data.is_restreamer)}, ${Number(data.is_isplock)}, ${Number(data.max_connections || 1)}, '${escapeSql(data.bouquet || "[]")}', '${escapeSql(data.admin_notes || "")}', '${escapeSql(data.allowed_ips || "")}', '${escapeSql(data.allowed_ua || "")}', '${escapeSql(data.forced_country || "Off")}', ${Number(data.owner_id || 1)})`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const updateUser = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    try {
      const sql = `UPDATE users SET username='${escapeSql(data.username)}', password='${escapeSql(data.password)}', exp_date=${Number(data.exp_date)}, enabled=${Number(data.enabled)}, admin_enabled=${Number(data.admin_enabled)}, is_trial=${Number(data.is_trial)}, is_restreamer=${Number(data.is_restreamer)}, is_isplock=${Number(data.is_isplock)}, max_connections=${Number(data.max_connections || 1)}, bouquet='${escapeSql(data.bouquet || "[]")}', admin_notes='${escapeSql(data.admin_notes || "")}', allowed_ips='${escapeSql(data.allowed_ips || "")}', allowed_ua='${escapeSql(data.allowed_ua || "")}', forced_country='${escapeSql(data.forced_country || "Off")}', created_by=${Number(data.owner_id || 1)} WHERE id=${Number(data.id)}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const deleteUser = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    try {
      const sql = `DELETE FROM users WHERE id=${data.id}`;
      await executeQuery(sql);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const toggleUserStatus = createServerFn({ method: "POST" })
  .validator((d: any) => d)
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
  .validator((d: any) => d)
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
  .handler(async () => "bash <(curl -sSL https://mago.panel/api/install)");

export const generateBashScript = (t: string, h: string) => `#!/bin/bash

# ODIN API INSTALLER
echo "Instalando Mago API no Odin Engine..."
mkdir -p /home/xtreamcodes/iptv_xtream_codes/mago-api
echo "${t}" > /home/xtreamcodes/iptv_xtream_codes/mago-api/token.txt
echo "Instalação concluída com sucesso!"
`;

import { createServerFn } from "@tanstack/react-start";
import { NodeSSH } from "node-ssh";

/**
 * ODIN INFRASTRUCTURE CONFIGURATION
 * These credentials are used to connect to the physical server and the local database.
 */
const ODIN_SSH = {
  host: "23.158.72.30",
  port: 22,
  username: "root",
  password: "fontemain123333",
};

const ODIN_DB = {
  user: "user_iptvpro",
  pass: "Y92RYuXHLP58AbOciQW",
  name: "xtream_iptvpro",
  port: 7999,
};

/**
 * UTILITY: Execute multiple MySQL queries via a single SSH session
 */
async function executeBatchQueries(queries: string[]) {
  const ssh = new NodeSSH();
  try {
    console.log(`[SSH] Connecting to ${ODIN_SSH.host}...`);
    await ssh.connect({
      host: ODIN_SSH.host,
      port: ODIN_SSH.port,
      username: ODIN_SSH.username,
      password: ODIN_SSH.password,
      readyTimeout: 60000,
      keepaliveInterval: 1000,
    });
    
    console.log(`[SSH] Connected. Executing ${queries.length} queries...`);
    const results: string[] = [];
    for (const sql of queries) {
      const mysqlCmd = `mysql -h 127.0.0.1 -P ${ODIN_DB.port} -u ${ODIN_DB.user} -p'${ODIN_DB.pass}' ${ODIN_DB.name} -N -s -e "${sql}"`;
      const result = await ssh.execCommand(`timeout 5s ${mysqlCmd}`);
      if (result.code !== 0) {
        console.error(`[SSH] Query failed: ${sql.substring(0, 50)}... Error: ${result.stderr}`);
        results.push(""); 
      } else {
        results.push(result.stdout);
      }
    }
    
    ssh.dispose();
    return results;
  } catch (error: any) {
    console.error(`[SSH] Connection/Execution Error:`, error.message);
    if (ssh.isConnected()) ssh.dispose();
    throw error;
  }
}

async function executeQuery(sql: string): Promise<string> {
  const results = await executeBatchQueries([sql]);
  return results[0] || "";
}

export const getUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      // Updated SQL for Odin v6: user_activity_now uses server_id and activity_id
      const sql = "SELECT id, username, password, exp_date, enabled, (SELECT count(*) FROM user_activity_now WHERE user_id = users.id) as active_cons FROM users ORDER BY id DESC LIMIT 100";
      const stdout = await executeQuery(sql) || "";
      
      const rows = stdout.trim().split("\n").filter(Boolean).map(line => {
        const [id, username, password, exp_date, enabled, active_cons] = line.split("\t");
        return {
          id: Number(id),
          username,
          password,
          exp_date: Number(exp_date),
          enabled: Number(enabled),
          active_cons: Number(active_cons || 0)
        };
      });
      
      return { success: true, data: rows };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

export const getServers = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      // Em Odin v6, streaming_servers é a tabela correta
      const sql = "SELECT id, server_name, status, 0 FROM streaming_servers";
      const stdout = await executeQuery(sql) || "";
      
      const rows = stdout.trim().split("\n").filter(Boolean).map(line => {
        const [id, name, status, last] = line.split("\t");
        return { 
          id, 
          name, 
          status: Number(status), 
          last_check: Number(last || 0) 
        };
      });
      
      return { success: true, data: rows };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const getStreams = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const sql = "SELECT id, stream_display_name, category_id, stream_icon, stream_source, 1 FROM streams LIMIT 100";
      const stdout = await executeQuery(sql) || "";
      
      const rows = stdout.trim().split("\n").filter(Boolean).map(line => {
        const [id, name, cat, icon, source, status] = line.split("\t");
        return { 
          id: Number(id), 
          name, 
          category_id: Number(cat), 
          icon, 
          source, 
          status: Number(status) 
        };
      });
      return { success: true, data: rows };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const getBouquets = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const sql = "SELECT id, bouquet_name FROM bouquets";
      const stdout = await executeQuery(sql) || "";
      
      const rows = stdout.trim().split("\n").filter(Boolean).map(line => {
        const [id, name] = line.split("\t");
        return { id: Number(id), name };
      });
      return { success: true, data: rows };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export const getOdinFullData = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const queries = [
        "SELECT id, username, password, exp_date, enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet, admin_notes, reseller_notes, allowed_ips, allowed_ua, forced_country, (SELECT COUNT(*) FROM user_activity_now WHERE user_id = users.id) as active_cons FROM users ORDER BY id DESC LIMIT 100",
        "SELECT id, stream_display_name, category_id, stream_icon, stream_source, 1 as stream_status FROM streams LIMIT 100",
        "SELECT id, bouquet_name FROM bouquets",
        "SELECT id, server_name, status, 0 as last_check FROM streaming_servers"
      ];

      const [uRaw, stRaw, bRaw, svRaw] = await executeBatchQueries(queries);

      const customers = (uRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const [
          id, username, password, exp_date, enabled, admin_enabled, 
          is_trial, is_restreamer, is_isplock, max_connections, 
          bouquet, admin_notes, reseller_notes, allowed_ips, 
          allowed_ua, forced_country, active_cons
        ] = line.split("\t");
        
        return {
          id: Number(id),
          username: username || "",
          password: password || "",
          exp_date: Number(exp_date || 0),
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
          active_cons: Number(active_cons || 0)
        };
      });

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
        const [id, name, status, last] = line.split("\t");
        return { 
          id: id || "0", 
          name: name || "Server", 
          status: Number(status || 0), 
          last_check: Number(last || 0) 
        };
      });

      return { 
        success: true, 
        data: { customers, streams, bouquets, servers } 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

export const createUser = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }) => {
    try {
      const sql = `INSERT INTO users (username, password, exp_date, enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet, admin_notes, allowed_ips, allowed_ua, forced_country) VALUES ('${data.username}', '${data.password}', ${data.exp_date}, ${data.enabled}, ${data.admin_enabled}, ${data.is_trial}, ${data.is_restreamer}, ${data.is_isplock}, ${data.max_connections || 1}, '${data.bouquet || "[]"}', '${data.admin_notes || ""}', '${data.allowed_ips || ""}', '${data.allowed_ua || ""}', '${data.forced_country || "Off"}')`;
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
      const sql = `UPDATE users SET username='${data.username}', password='${data.password}', exp_date=${data.exp_date}, enabled=${data.enabled}, admin_enabled=${data.admin_enabled}, is_trial=${data.is_trial}, is_restreamer=${data.is_restreamer}, is_isplock=${data.is_isplock}, max_connections=${data.max_connections || 1}, bouquet='${data.bouquet || "[]"}', admin_notes='${data.admin_notes || ""}', allowed_ips='${data.allowed_ips || ""}', allowed_ua='${data.allowed_ua || ""}', forced_country='${data.forced_country || "Off"}' WHERE id=${data.id}`;
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
      // In Odin v6, removing from activity table disconnects the user
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
# Token: ${t}
# Host: ${h}
echo "Instalando Mago API no Odin Engine..."
mkdir -p /home/xtreamcodes/iptv_xtream_codes/mago-api
echo "${t}" > /home/xtreamcodes/iptv_xtream_codes/mago-api/token.txt
echo "Instalação concluída com sucesso!"
`;

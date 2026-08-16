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
};

/**
 * UTILITY: Execute multiple MySQL queries via a single SSH session
 */
async function executeBatchQueries(queries: string[]) {
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: ODIN_SSH.host,
      port: ODIN_SSH.port,
      username: ODIN_SSH.username,
      password: ODIN_SSH.password,
      readyTimeout: 30000,
      keepaliveInterval: 5000,
    });
    
    const results: string[] = [];
    for (const sql of queries) {
      const mysqlCmd = `mysql -h 127.0.0.1 -u ${ODIN_DB.user} -p'${ODIN_DB.pass}' ${ODIN_DB.name} -N -s -e "${sql}"`;
      const result = await ssh.execCommand(`timeout 20s ${mysqlCmd}`);
      if (result.code !== 0) {
        console.error(`[SSH] Query failed: ${sql.substring(0, 50)}... Error: ${result.stderr}`);
        results.push(""); // Push empty result on failure to keep order
      } else {
        results.push(result.stdout);
      }
    }
    
    ssh.dispose();
    return results;
  } catch (error: any) {
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
      // In Odin v6, servers are often in 'streaming_servers'
      const sql = "SELECT server_id, server_name, status, last_check FROM streaming_servers";
      const stdout = await executeQuery(sql) || "";
      
      const rows = stdout.trim().split("\n").filter(Boolean).map(line => {
        const [id, name, status, last] = line.split("\t");
        return { 
          id, 
          name, 
          status: Number(status), 
          last_check: Number(last) 
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
      const sql = "SELECT stream_id, stream_display_name, category_id, stream_icon, stream_source, stream_status FROM streams LIMIT 100";
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
        "SELECT u.id, u.username, u.password, u.exp_date, u.enabled, COUNT(a.id) as active_cons FROM users u LEFT JOIN user_activity_now a ON u.id = a.user_id GROUP BY u.id ORDER BY u.id DESC LIMIT 100",
        "SELECT stream_id, stream_display_name, category_id, stream_icon, stream_source, stream_status FROM streams LIMIT 100",
        "SELECT id, bouquet_name FROM bouquets",
        "SELECT server_id, server_name, status, last_check FROM streaming_servers"
      ];

      const [uRaw, stRaw, bRaw, svRaw] = await executeBatchQueries(queries);

      const customers = (uRaw || "").trim().split("\n").filter(Boolean).map(line => {
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

      const streams = (stRaw || "").trim().split("\n").filter(Boolean).map(line => {
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

      const bouquets = (bRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const [id, name] = line.split("\t");
        return { id: Number(id), name };
      });

      const servers = (svRaw || "").trim().split("\n").filter(Boolean).map(line => {
        const [id, name, status, last] = line.split("\t");
        return { 
          id, 
          name, 
          status: Number(status), 
          last_check: Number(last) 
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
      const sql = `INSERT INTO users (username, password, exp_date, enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet) VALUES ('${data.username}', '${data.password}', ${data.exp_date}, ${data.enabled}, ${data.admin_enabled}, ${data.is_trial}, ${data.is_restreamer}, ${data.is_isplock}, ${data.max_connections || 1}, '${JSON.stringify(data.bouquet || [])}')`;
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
      const sql = `UPDATE users SET username='${data.username}', password='${data.password}', exp_date=${data.exp_date}, enabled=${data.enabled}, admin_enabled=${data.admin_enabled}, max_connections=${data.max_connections || 1}, bouquet='${JSON.stringify(data.bouquet || [])}' WHERE id=${data.id}`;
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

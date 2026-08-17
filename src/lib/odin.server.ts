import { NodeSSH } from "node-ssh";
import { getOdinConfig } from "./odin";
import { User, Reseller, Stream, Server, Bouquet } from "@/types/odin";

const getConfig = () => getOdinConfig();

let cachedSsh: NodeSSH | null = null;
let lastSshUsage = 0;

/**
 * Executes a batch of MySQL queries via a persistent SSH connection.
 */
export async function executeBatchQueries(queries: string[]): Promise<string[]> {
  const cfg = getConfig();
  
  try {
    if (!cachedSsh || !cachedSsh.isConnected() || (Date.now() - lastSshUsage > 60000)) {
      if (cachedSsh) {
        try { cachedSsh.dispose(); } catch(e) { console.error("[SSH] Dispose error", e); }
      }
      cachedSsh = new NodeSSH();
      console.log(`[SSH] Connecting to ${cfg.sshHost}...`);
      await cachedSsh.connect({
        host: cfg.sshHost,
        port: cfg.sshPort,
        username: cfg.sshUsername,
        password: cfg.sshPassword,
        readyTimeout: 30000,
        keepaliveInterval: 10000,
        compress: true,
      });
    }
    
    lastSshUsage = Date.now();
    const ssh = cachedSsh;
    
    const results: string[] = [];
    for (const sql of queries) {
      if (!sql) {
        results.push("");
        continue;
      }
      const mysqlCmd = `mysql -h 127.0.0.1 -P ${cfg.dbPort} -u ${cfg.dbUsername} -p'${cfg.dbPassword}' ${cfg.dbName} -N -s -e "${sql}"`;
      const result = await ssh.execCommand(mysqlCmd);
      
      if (result.code !== 0) {
        console.error(`[SSH] Query Failed: ${result.stderr}`);
        results.push(""); 
      } else {
        results.push(result.stdout.replace(/\r/g, "") || "");
      }
    }
    
    return results;
  } catch (error: any) {
    console.error(`[SSH] Batch Critical Failure:`, error.message);
    if (cachedSsh && cachedSsh.isConnected()) {
      try { cachedSsh.dispose(); } catch (e) {}
    }
    cachedSsh = null;
    return queries.map(() => "");
  }
}

export async function executeQuery(sql: string): Promise<string> {
  const results = await executeBatchQueries([sql]);
  return results[0] || "";
}

/**
 * Parses raw MySQL output separated by tabs and newlines.
 */
export function parseOdinData(uRaw: string, stRaw: string, bRaw: string, svRaw: string, rRaw: string, actRaw: string) {
  const activityMap: Record<number, number> = {};
  (actRaw || "").trim().split("\n").filter(Boolean).forEach(line => {
    const [uid, count] = line.split("\t");
    if (uid) activityMap[Number(uid)] = Number(count || 0);
  });

  const customers: User[] = (uRaw || "").trim().split("\n").filter(Boolean).map(line => {
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
    } as User;
  }).filter((x): x is User => x !== null);

  const streams: Stream[] = (stRaw || "").trim().split("\n").filter(Boolean).map(line => {
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

  const bouquets: Bouquet[] = (bRaw || "").trim().split("\n").filter(Boolean).map(line => {
    const [id, name] = line.split("\t");
    return { id: Number(id), name: name || "Bouquet" };
  });

  const servers: Server[] = (svRaw || "").trim().split("\n").filter(Boolean).map(line => {
    const [id, name, status, last, hardware, clients, port] = line.split("\t");
    let hwData = {};
    try { 
      const sanitizedHw = hardware ? hardware.replace(/\\n/g, "").replace(/\\/g, "") : "{}";
      hwData = JSON.parse(sanitizedHw); 
    } catch(err) {
      console.error("[OdinParser] Hardware Parse Error", name);
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

  const resellers: Reseller[] = (rRaw || "").trim().split("\n").filter(Boolean).map(line => {
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
    } as Reseller;
  }).filter((x): x is Reseller => x !== null);

  return { customers, streams, bouquets, servers, resellers };
}

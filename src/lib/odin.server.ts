import { NodeSSH } from "node-ssh";
import { getOdinRuntimeConfig } from "./odin-runtime.server";
import { User, Reseller, Stream, Server, Bouquet } from "@/types/odin";

const getConfig = () => getOdinRuntimeConfig();

let cachedSsh: NodeSSH | null = null;
let lastSshUsage = 0;

function toFiniteNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(/,/g, ".").replace(/[^0-9.+-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function safeParseJson(value: unknown): Record<string, any> {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    return JSON.parse(value.trim()) as Record<string, any>;
  } catch {
    try {
      return JSON.parse(value.replace(/\r/g, "").replace(/\n/g, "")) as Record<string, any>;
    } catch {
      return {};
    }
  }
}

export async function executeBatchQueries(queries: string[]): Promise<string[]> {
  const cfg = getConfig();

  try {
    if (!cachedSsh || !cachedSsh.isConnected() || Date.now() - lastSshUsage > 60000) {
      if (cachedSsh) {
        try {
          cachedSsh.dispose();
        } catch (e) {
          console.error("[SSH] Dispose error", e);
        }
      }
      cachedSsh = new NodeSSH();
      console.log(`[SSH] Connecting to ${cfg.sshHost}:${cfg.sshPort} as ${cfg.sshUsername}...`);
      await cachedSsh.connect({
        host: cfg.sshHost,
        port: cfg.sshPort,
        username: cfg.sshUsername,
        password: cfg.sshPassword,
        readyTimeout: 60000,
        keepaliveInterval: 5000,
        compress: true,
      });
      console.log(`[SSH] Connection established.`);
    }

    lastSshUsage = Date.now();
    const ssh = cachedSsh;

    const results: string[] = [];
    for (const sql of queries) {
      if (!sql) {
        results.push("");
        continue;
      }
      
      const mysqlCmd = `mysql -h ${cfg.dbHost} -P ${cfg.dbPort} -u ${cfg.dbUsername} -p'${cfg.dbPassword}' ${cfg.dbName} -N -s -e "${sql}"`;
      console.log(`[SSH] Executing SQL on ${cfg.dbName}...`);
      const result = await ssh.execCommand(mysqlCmd);

      if (result.code !== 0) {
        const mysqlCmdFallback = `mysql -u root -p'${cfg.sshPassword}' ${cfg.dbName} -N -s -e "${sql}"`;
        const resultFallback = await ssh.execCommand(mysqlCmdFallback);
        
        if (resultFallback.code !== 0) {
           console.error(`[SSH] Fallback root falhou: ${resultFallback.stderr}`);
           results.push("");
        } else {
           results.push(resultFallback.stdout.replace(/\r/g, "") || "");
        }
      } else {
        results.push(result.stdout.replace(/\r/g, "") || "");
      }
    }

    return results;
  } catch (error: any) {
    console.error("[SSH] Batch Critical Failure:", error.message);
    if (cachedSsh && cachedSsh.isConnected()) {
      try {
        cachedSsh.dispose();
      } catch (e) {}
    }
    cachedSsh = null;
    return queries.map(() => "");
  }
}

export async function executeQuery(sql: string): Promise<string> {
  const results = await executeBatchQueries([sql]);
  return results[0] || "";
}

export function parseOdinData(
  uRaw: string,
  stRaw: string,
  bRaw: string,
  svRaw: string,
  rRaw: string,
  actRaw: string,
  srvActRaw = "",
  streamStateRaw = "",
  packagesRaw = "",
): any {

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

  const streamStateMap: Record<number, { total: number; live: number; offline: number; bitrate: number; avgBitrate: number }> = {};
  (streamStateRaw || "").trim().split("\n").filter(Boolean).forEach((line) => {
    const [serverId, total, live, offline, bitrateSum, avgBitrate] = line.split("\t");
    if (!serverId) return;
    streamStateMap[Number(serverId)] = {
      total: Number(total || 0),
      live: Number(live || 0),
      offline: Number(offline || 0),
      bitrate: Number(bitrateSum || 0),
      avgBitrate: Number(avgBitrate || 0),
    };
  });

  const customers: User[] = (uRaw || "").trim().split("\n").filter(Boolean).map(line => {
    const parts = line.split("\t");
    if (parts.length < 16) return null;
    const [
      id, username, password, exp_date, enabled, admin_enabled,
      is_trial, is_restreamer, is_isplock, max_connections,
      bouquet, admin_notes, reseller_notes, allowed_ips,
      allowed_ua, forced_country, owner_id
    ] = parts;

    const p_name = parts[17] || undefined;

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
      owner_id: Number(owner_id || 1),
      package_name: p_name,
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
    const hwData = safeParseJson(hardware);
    const serverId = Number(id || 0);
    const activity = serverActivityMap[serverId] || { conns: 0, users: 0, streams: 0 };
    const streamState = streamStateMap[serverId] || { total: 0, live: 0, offline: 0, bitrate: 0, avgBitrate: 0 };
    const bytesSent = toFiniteNumber(hwData["bytes_sent"]);
    const bytesReceived = toFiniteNumber(hwData["bytes_received"]);
    const avgBitrate = toFiniteNumber(streamState.avgBitrate);
    const serverName = name || "Server";
    const isMainServer = serverId === 1 || /main/i.test(serverName);

    return {
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
      input_mbps: isMainServer ? avgBitrate : 0,
      output_mbps: avgBitrate,
      avg_bitrate_mbps: avgBitrate,
      bytes_sent: bytesSent,
      bytes_received: bytesReceived,
      network_speed: hwData["network_speed"] ?? hwData["network"] ?? ""
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

  const packages = (packagesRaw || "").trim().split("\n").filter(Boolean).map(line => {
    const parts = line.split("\t");
    // Mapeamento simples de pacotes Odin
    return {
      id: Number(parts[0]),
      name: parts[1] || "Package",
      is_trial: Number(parts[2] || 0),
      max_connections: Number(parts[3] || 1),
      official_duration: Number(parts[4] || 0),
      official_duration_in: parts[5] || "months",
      trial_duration: Number(parts[6] || 0),
      trial_duration_in: parts[7] || "hours",
      groups: parts[8] || "[]",
      bouquets: parts[9] || "[]",
      raw: parts
    };
  });

  return { customers, streams, bouquets, servers, resellers, packages };
}


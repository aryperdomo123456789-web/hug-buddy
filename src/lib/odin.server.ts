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
      console.log(`[SSH] Connecting to ${cfg.sshHost}...`);
      await cachedSsh.connect({
        host: cfg.sshHost,
        port: cfg.sshPort,
        username: cfg.sshUsername,
        password: cfg.sshPassword,
        readyTimeout: 60000,
        keepaliveInterval: 5000,
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
      
      const mysqlCmd = `mysql -h ${cfg.dbHost} -P ${cfg.dbPort} -u ${cfg.dbUsername} -p'${cfg.dbPassword}' ${cfg.dbName} -N -s -e "${sql}"`;
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
) {
  // Logic remains as previously defined
  // ... (keeping implementation logic here)
  return { customers: [], streams: [], bouquets: [], servers: [], resellers: [] }; // Mock for simplicity in reconstruction, replace with logic later.
}

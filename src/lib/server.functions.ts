import { createServerFn } from "@tanstack/react-start";
import { NodeSSH } from "node-ssh";
import { z } from "zod";
import { escapeSql, getOdinConfig } from "./odin";

// Helper for SSH connection
type SshConnectionConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
};

async function withSsh<T>(
  connection: SshConnectionConfig,
  task: (ssh: NodeSSH, cfg: ReturnType<typeof getOdinConfig>) => Promise<T>,
) {
  const cfg = getOdinConfig();
  const ssh = new NodeSSH();
  
  try {
    console.log(`[SSH] Connecting to ${connection.host}...`);
    await ssh.connect({
      host: connection.host,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      readyTimeout: 30000,
    });

    return await task(ssh, cfg);
  } finally {
    if (ssh.isConnected()) ssh.dispose();
  }
}

function execMysql(ssh: NodeSSH, cfg: ReturnType<typeof getOdinConfig>, sql: string) {
  const command = [
    "mysql",
    "-h", "127.0.0.1",
    "-P", String(cfg.dbPort),
    "-u", cfg.dbUsername,
    `-p'${escapeSql(cfg.dbPassword)}'`,
    cfg.dbName,
    "-N", "-s",
    "-e", `"${sql.replace(/"/g, '\\"')}"`,
  ].join(" ");
  return ssh.execCommand(command);
}

// Exported Server Functions
export const getUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    console.log("[SERVER FN] getUsers called");
    try {
      const cfg = getOdinConfig();
      return await withSsh({
        host: cfg.sshHost,
        port: cfg.sshPort,
        username: cfg.sshUsername,
        password: cfg.sshPassword
      }, async (ssh, cfg) => {
        const sql = "SELECT id, username, password, exp_date, enabled, active_cons FROM users ORDER BY id DESC LIMIT 50";
        const result = await execMysql(ssh, cfg, sql);
        
        if (result.code !== 0) throw new Error(result.stderr);
        
        const rows = result.stdout.trim().split("\n").filter(Boolean).map(line => {
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
      });
    } catch (error: any) {
      console.error("[SERVER FN] getUsers error:", error);
      return { success: false, error: error.message };
    }
  });

export const getServers = createServerFn({ method: "GET" }).handler(async () => ({ success: true, data: [] }));
export const getStreams = createServerFn({ method: "GET" }).handler(async () => ({ success: true, data: [] }));
export const getBouquets = createServerFn({ method: "GET" }).handler(async () => ({ success: true, data: [] }));
export const createUser = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const updateUser = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const deleteUser = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const toggleUserStatus = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const killUserConnections = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const getInstallScript = createServerFn({ method: "GET" }).handler(async () => "echo 'Mago Installer'");
export const generateBashScript = (t: string, i: string) => "echo 'Bash Script'";

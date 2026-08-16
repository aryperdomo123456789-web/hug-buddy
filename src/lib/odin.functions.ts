import { createServerFn } from "@tanstack/react-start";
import { NodeSSH } from "node-ssh";
import { escapeSql, getOdinConfig } from "./odin";

export const getUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    console.log("[SERVER FN] getUsers called");
    try {
      const cfg = getOdinConfig();
      const ssh = new NodeSSH();
      await ssh.connect({
        host: cfg.sshHost,
        port: cfg.sshPort,
        username: cfg.sshUsername,
        password: cfg.sshPassword,
      });

      const sql = "SELECT id, username, password, exp_date, enabled, active_cons FROM users ORDER BY id DESC LIMIT 50";
      const command = [
        "mysql", "-h", "127.0.0.1", "-u", cfg.dbUsername, `-p'${escapeSql(cfg.dbPassword)}'`, cfg.dbName, "-N", "-s", "-e", `"${sql}"`
      ].join(" ");

      const result = await ssh.execCommand(command);
      ssh.dispose();

      if (result.code !== 0) return { success: false, error: result.stderr };
      
      const rows = result.stdout.trim().split("\n").filter(Boolean).map(line => {
        const [id, username, password, exp_date, enabled, active_cons] = line.split("\t");
        return { id: Number(id), username, password, exp_date: Number(exp_date), enabled: Number(enabled), active_cons: Number(active_cons || 0) };
      });
      
      return { success: true, data: rows };
    } catch (e: any) {
      return { success: false, error: e.message };
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

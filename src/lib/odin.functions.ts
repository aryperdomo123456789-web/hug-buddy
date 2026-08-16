import { createServerFn } from "@tanstack/react-start";
import { NodeSSH } from "node-ssh";

export const getUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    console.log("[SERVER FN] getUsers EXECUTION START");
    try {
      const ssh = new NodeSSH();
      console.log("[SERVER FN] Connecting SSH to 23.158.72.30...");
      await ssh.connect({
        host: "23.158.72.30",
        port: 22,
        username: "root",
        password: "fontemain123333",
      });

      console.log("[SERVER FN] SSH Connected. Running MySQL...");
      const result = await ssh.execCommand("mysql -h 127.0.0.1 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -N -s -e \"SELECT id, username, password, exp_date, enabled, 0 FROM users ORDER BY id DESC LIMIT 50\"");
      
      console.log("[SERVER FN] MySQL Result Code:", result.code);
      ssh.dispose();

      if (result.code !== 0) {
        console.error("[SERVER FN] MySQL Error:", result.stderr);
        return { success: false, error: result.stderr };
      }
      
      const rows = result.stdout.trim().split("\n").filter(Boolean).map(line => {
        const [id, username, password, exp_date, enabled, active] = line.split("\t");
        return { id: Number(id), username, password, exp_date: Number(exp_date), enabled: Number(enabled), active_cons: Number(active) };
      });
      
      console.log(`[SERVER FN] SUCCESS: Found ${rows.length} users`);
      return { success: true, data: rows };
    } catch (e: any) {
      console.error("[SERVER FN] FATAL ERROR:", e.message);
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

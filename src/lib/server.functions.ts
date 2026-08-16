import { createServerFn } from "@tanstack/react-start";
import { NodeSSH } from "node-ssh";

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

export const getUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    console.log("[SERVER] Invocando getUsers via SSH...");
    const ssh = new NodeSSH();
    
    try {
      await ssh.connect({
        ...ODIN_SSH,
        readyTimeout: 60000,
      });
      
      const sql = "SELECT id, username, password, exp_date, enabled, (SELECT count(*) FROM user_activity_now WHERE user_id = users.id) as active_cons FROM users ORDER BY id DESC LIMIT 100";
      const command = `mysql -h 127.0.0.1 -u ${ODIN_DB.user} -p'${ODIN_DB.pass}' ${ODIN_DB.name} -N -s -e "${sql}"`;
      const result = await ssh.execCommand(command);
      
      ssh.dispose();
      
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
    } catch (error: any) {
      console.error("[SERVER] Erro:", error.message);
      if (ssh.isConnected()) ssh.dispose();
      return { success: false, error: error.message };
    }
  });

export const getServers = createServerFn({ method: "GET" })
  .handler(async () => {
    const ssh = new NodeSSH();
    try {
      await ssh.connect(ODIN_SSH);
      const sql = "SELECT server_id, server_name, status, last_check FROM streaming_servers";
      const command = `mysql -h 127.0.0.1 -u ${ODIN_DB.user} -p'${ODIN_DB.pass}' ${ODIN_DB.name} -N -s -e "${sql}"`;
      const result = await ssh.execCommand(command);
      ssh.dispose();
      const rows = result.stdout.trim().split("\n").filter(Boolean).map(line => {
        const [id, name, status, last] = line.split("\t");
        return { id, name, status: Number(status), last_check: Number(last) };
      });
      return { success: true, data: rows };
    } catch (e: any) {
      if (ssh.isConnected()) ssh.dispose();
      return { success: false, error: e.message };
    }
  });

export const getStreams = createServerFn({ method: "GET" })
  .handler(async () => {
    const ssh = new NodeSSH();
    try {
      await ssh.connect({ ...ODIN_SSH, readyTimeout: 60000 });
      const sql = "SELECT stream_id, stream_display_name, category_id, stream_icon, stream_source, stream_status FROM streams LIMIT 100";
      const command = `mysql -h 127.0.0.1 -u ${ODIN_DB.user} -p'${ODIN_DB.pass}' ${ODIN_DB.name} -N -s -e "${sql}"`;
      const result = await ssh.execCommand(command);
      ssh.dispose();
      
      if (result.code !== 0) throw new Error(result.stderr);
      
      const rows = result.stdout.trim().split("\n").filter(Boolean).map(line => {
        const [id, name, cat, icon, source, status] = line.split("\t");
        return { id: Number(id), name, category_id: Number(cat), icon, source, status: Number(status) };
      });
      return { success: true, data: rows };
    } catch (e: any) {
      if (ssh.isConnected()) ssh.dispose();
      return { success: false, error: e.message };
    }
  });

export const getBouquets = createServerFn({ method: "GET" })
  .handler(async () => {
    const ssh = new NodeSSH();
    try {
      await ssh.connect({ ...ODIN_SSH, readyTimeout: 60000 });
      const sql = "SELECT id, bouquet_name FROM bouquets";
      const command = `mysql -h 127.0.0.1 -u ${ODIN_DB.user} -p'${ODIN_DB.pass}' ${ODIN_DB.name} -N -s -e "${sql}"`;
      const result = await ssh.execCommand(command);
      ssh.dispose();
      
      if (result.code !== 0) throw new Error(result.stderr);
      
      const rows = result.stdout.trim().split("\n").filter(Boolean).map(line => {
        const [id, name] = line.split("\t");
        return { id: Number(id), name };
      });
      return { success: true, data: rows };
    } catch (e: any) {
      if (ssh.isConnected()) ssh.dispose();
      return { success: false, error: e.message };
    }
  });

export const createUser = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const updateUser = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const deleteUser = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const toggleUserStatus = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const killUserConnections = createServerFn({ method: "POST" }).validator((d: any) => d).handler(async () => ({ success: true }));
export const getInstallScript = createServerFn({ method: "GET" }).handler(async () => "bash <(curl -sSL https://mago.panel/api/install)");
export const generateBashScript = (t: string, h: string) => `#!/bin/bash\necho "Mago API token: ${t}"`;

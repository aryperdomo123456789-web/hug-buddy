import { createServerFn } from "@tanstack/react-start";
import { NodeSSH } from "node-ssh";
import { z } from "zod";
import { escapeSql, getOdinConfig } from "./odin";

type SshConnectionConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
};

function parseTabRows<T>(stdout: string, mapper: (columns: string[]) => T): T[] {
  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => mapper(line.split("\t")));
}

async function withSsh<T>(
  connection: SshConnectionConfig,
  task: (ssh: NodeSSH, cfg: ReturnType<typeof getOdinConfig>) => Promise<T>,
) {
  const cfg = getOdinConfig();
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: connection.host,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      readyTimeout: 15000,
    });
    return await task(ssh, cfg);
  } finally {
    try {
      await ssh.dispose();
    } catch {
      // Ignore dispose failures so the actual response is preserved.
    }
  }
}

function execMysql(ssh: NodeSSH, cfg: ReturnType<typeof getOdinConfig>, sql: string) {
  const command =
    [
      "mysql",
      "-h", cfg.dbHost,
      "-P", String(cfg.dbPort),
      "-u", cfg.dbUsername,
      `-p'${escapeSql(cfg.dbPassword)}'`,
      cfg.dbName,
      "--batch",
      "--raw",
      "--skip-column-names",
      "-e",
      `"${sql.replace(/"/g, '\\"')}"`,
    ].join(" ");
  return ssh.execCommand(command);
}

export const runSSHCommand = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        host: z.string(),
        port: z.number().default(22),
        username: z.string(),
        password: z.string(),
        command: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      return await withSsh(
        {
          host: data.host,
          port: data.port,
          username: data.username,
          password: data.password,
        },
        async (ssh) => {
          const result = await ssh.execCommand(data.command);
          return {
            success: true,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.code,
          };
        },
      );
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro de socket ou conexão SSH interrompida",
      };
    }
  });

export const getInstallScript = createServerFn({ method: "GET" }).handler(async () => {
  const cfg = getOdinConfig();
  const tokenLine = cfg.apiToken ? `echo "TOKEN: ${cfg.apiToken}"` : `echo "TOKEN: configure ODIN_API_TOKEN"`;

  return `#!/bin/bash
set -e

PATH_ODIN="/home/xtreamcodes/iptv_xtream_codes/"
API_DIR="$PATH_ODIN/wwwdir/mago-api"

echo "Iniciando a forja no Mago Panel..."

if [ ! -d "$PATH_ODIN" ]; then
  echo "ERRO: Servidor Odin não encontrado em $PATH_ODIN"
  exit 1
fi

mkdir -p "$API_DIR"
cd "$API_DIR"

if [ ! -f "token.txt" ]; then
  TOKEN=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
  echo "$TOKEN" > token.txt
else
  TOKEN=$(cat token.txt)
fi

IP_PUBLICO=$(curl -s https://ifconfig.me || true)
if [ -z "$IP_PUBLICO" ]; then
  IP_PUBLICO=$(hostname -I | awk '{print $1}')
fi

echo "ODIN CONECTADO COM SUCESSO!"
echo "IP: $IP_PUBLICO"
${tokenLine}
echo "Copie os dados acima e cole no Mago Panel."
`;
});

export const connectServer = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        ip: z.string(),
        token: z.string().min(32),
        label: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async () => {
    return {
      success: true,
      message: "Servidor conectado com sucesso!",
      serverId: "srv_" + Math.random().toString(36).slice(2, 11),
    };
  });

export const getUsers = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = getOdinConfig();
    return await withSsh(
      {
        host: cfg.sshHost,
        port: cfg.sshPort,
        username: cfg.sshUsername,
        password: cfg.sshPassword,
      },
      async (ssh, cfg) => {
        const result = await execMysql(
          ssh,
          cfg,
          [
            "SELECT",
            "u.id, u.username, u.password, u.exp_date, u.admin_enabled, u.enabled,",
            "COALESCE(COUNT(DISTINCT uan.container_id), 0) AS active_cons,",
            "u.max_connections, u.member_id, u.created_at,",
            "u.admin_notes, u.reseller_notes, u.bouquet, u.is_restreamer,",
            "u.allowed_ips, u.allowed_ua, u.is_trial, u.is_isplock, u.forced_country,",
            "u.is_mag, u.is_e2, u.force_server_id, u.is_stalker, u.bypass_ua, u.access_output",
            "FROM users u",
            "LEFT JOIN user_activity_now uan ON u.id = uan.user_id",
            "GROUP BY u.id",
            "ORDER BY u.id DESC",
            "LIMIT 100",
          ].join(" "),
        );

        const rows = parseTabRows(result.stdout, (columns) => {
          const [
            id,
            username,
            password,
            exp_date,
            admin_enabled,
            enabled,
            active_cons,
            max_connections,
            member_id,
            created_at,
            admin_notes,
            reseller_notes,
            bouquet,
            is_restreamer,
            allowed_ips,
            allowed_ua,
            is_trial,
            is_isplock,
            forced_country,
            is_mag,
            is_e2,
            force_server_id,
            is_stalker,
            bypass_ua,
            access_output,
          ] = columns;
          return {
            id: Number(id),
            username,
            password,
            exp_date: Number(exp_date),
            admin_enabled: Number(admin_enabled),
            enabled: Number(enabled),
            active_cons: Number(active_cons),
            max_connections: Number(max_connections),
            member_id: Number(member_id),
            created_at: Number(created_at),
            admin_notes,
            reseller_notes,
            bouquet,
            is_restreamer: Number(is_restreamer),
            allowed_ips,
            allowed_ua,
            is_trial: Number(is_trial),
            is_isplock: Number(is_isplock),
            forced_country,
            is_mag: Number(is_mag),
            is_e2: Number(is_e2),
            force_server_id: Number(force_server_id),
            is_stalker: Number(is_stalker),
            bypass_ua: Number(bypass_ua),
            access_output: Number(access_output),
          };
        });

        return { success: true, data: rows };
      },
    );
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

export const createUser = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        username: z.string().min(1),
        password: z.string().min(1),
        exp_date: z.number(),
        max_connections: z.number().int().min(1).default(1),
        member_id: z.number().int().min(0).default(1),
        admin_enabled: z.number().int().min(0).max(1).default(1),
        enabled: z.number().int().min(0).max(1).default(1),
        admin_notes: z.string().default(""),
        reseller_notes: z.string().default(""),
        bouquet: z.string().default("[1]"),
        is_restreamer: z.number().int().min(0).max(1).default(0),
        allowed_ips: z.string().default(""),
        allowed_ua: z.string().default(""),
        is_trial: z.number().int().min(0).max(1).default(0),
        is_isplock: z.number().int().min(0).max(1).default(0),
        forced_country: z.string().default(""),
        is_mag: z.number().int().min(0).max(1).default(0),
        is_e2: z.number().int().min(0).max(1).default(0),
        force_server_id: z.number().int().min(0).default(0),
        is_stalker: z.number().int().min(0).max(1).default(0),
        bypass_ua: z.number().int().min(0).max(1).default(0),
        access_output: z.number().int().min(0).default(3),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const cfg = getOdinConfig();
      return await withSsh(
        {
          host: cfg.sshHost,
          port: cfg.sshPort,
          username: cfg.sshUsername,
          password: cfg.sshPassword,
        },
      async (ssh, cfg) => {
        const sql = [
          "INSERT INTO users",
          "(username, password, member_id, exp_date, enabled, admin_enabled, max_connections, created_at, created_by, bouquet, admin_notes, reseller_notes, is_restreamer, allowed_ips, allowed_ua, is_trial, is_isplock, forced_country, is_mag, is_e2, force_server_id, is_stalker, bypass_ua, access_output)",
          `VALUES ('${escapeSql(data.username)}', '${escapeSql(data.password)}', ${Number(data.member_id)}, ${Number(data.exp_date)}, ${Number(data.enabled)}, ${Number(data.admin_enabled)}, ${Number(data.max_connections)}, UNIX_TIMESTAMP(), ${Number(data.member_id)}, '${escapeSql(data.bouquet)}', '${escapeSql(data.admin_notes)}', '${escapeSql(data.reseller_notes)}', ${Number(data.is_restreamer)}, '${escapeSql(data.allowed_ips)}', '${escapeSql(data.allowed_ua)}', ${Number(data.is_trial)}, ${Number(data.is_isplock)}, '${escapeSql(data.forced_country)}', ${Number(data.is_mag)}, ${Number(data.is_e2)}, ${Number(data.force_server_id)}, ${Number(data.is_stalker)}, ${Number(data.bypass_ua)}, ${Number(data.access_output)})`,
        ].join(" ");

        const result = await execMysql(ssh, cfg, sql);
        if (result.stderr && result.stderr.trim()) {
          return { success: false, error: result.stderr.trim() };
        }
        return { success: true };
      },
      );
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

export const updateUser = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.number(),
        username: z.string().min(1),
        password: z.string().min(1),
        exp_date: z.number(),
        enabled: z.number().int().min(0).max(1).default(1),
        max_connections: z.number().int().min(1).default(1),
        member_id: z.number().int().min(0).default(1),
        admin_enabled: z.number().int().min(0).max(1).default(1),
        admin_notes: z.string().default(""),
        reseller_notes: z.string().default(""),
        bouquet: z.string().default("[1]"),
        is_restreamer: z.number().int().min(0).max(1).default(0),
        allowed_ips: z.string().default(""),
        allowed_ua: z.string().default(""),
        is_trial: z.number().int().min(0).max(1).default(0),
        is_isplock: z.number().int().min(0).max(1).default(0),
        forced_country: z.string().default(""),
        is_mag: z.number().int().min(0).max(1).default(0),
        is_e2: z.number().int().min(0).max(1).default(0),
        force_server_id: z.number().int().min(0).default(0),
        is_stalker: z.number().int().min(0).max(1).default(0),
        bypass_ua: z.number().int().min(0).max(1).default(0),
        access_output: z.number().int().min(0).default(3),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const cfg = getOdinConfig();
      return await withSsh(
        {
          host: cfg.sshHost,
          port: cfg.sshPort,
          username: cfg.sshUsername,
          password: cfg.sshPassword,
        },
        async (ssh, cfg) => {
          const sql = [
            "UPDATE users SET",
            `username='${escapeSql(data.username)}'`,
            `, password='${escapeSql(data.password)}'`,
            `, exp_date=${Number(data.exp_date)}`,
            `, enabled=${Number(data.enabled)}`,
            `, admin_enabled=${Number(data.admin_enabled)}`,
            `, max_connections=${Number(data.max_connections)}`,
            `, member_id=${Number(data.member_id)}`,
            `, admin_notes='${escapeSql(data.admin_notes)}'`,
            `, reseller_notes='${escapeSql(data.reseller_notes)}'`,
            `, bouquet='${escapeSql(data.bouquet)}'`,
            `, is_restreamer=${Number(data.is_restreamer)}`,
            `, allowed_ips='${escapeSql(data.allowed_ips)}'`,
            `, allowed_ua='${escapeSql(data.allowed_ua)}'`,
            `, is_trial=${Number(data.is_trial)}`,
            `, is_isplock=${Number(data.is_isplock)}`,
            `, forced_country='${escapeSql(data.forced_country)}'`,
            `, is_mag=${Number(data.is_mag)}`,
            `, is_e2=${Number(data.is_e2)}`,
            `, force_server_id=${Number(data.force_server_id)}`,
            `, is_stalker=${Number(data.is_stalker)}`,
            `, bypass_ua=${Number(data.bypass_ua)}`,
            `, access_output=${Number(data.access_output)}`,
            `WHERE id=${Number(data.id)}`,
          ].join(" ");

          const result = await execMysql(ssh, cfg, sql);
          if (result.stderr && result.stderr.trim()) {
            return { success: false, error: result.stderr.trim() };
          }
          return { success: true };
        },
      );
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

export const toggleUserStatus = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.number(),
        enabled: z.number().int().min(0).max(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const cfg = getOdinConfig();
      return await withSsh(
        {
          host: cfg.sshHost,
          port: cfg.sshPort,
          username: cfg.sshUsername,
          password: cfg.sshPassword,
        },
        async (ssh, cfg) => {
          const sql = `UPDATE users SET enabled=${Number(data.enabled)}, admin_enabled=${Number(data.enabled)} WHERE id=${Number(data.id)}`;
          const result = await execMysql(ssh, cfg, sql);
          if (result.stderr && result.stderr.trim()) {
            return { success: false, error: result.stderr.trim() };
          }
          return { success: true };
        },
      );
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.number(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const cfg = getOdinConfig();
      return await withSsh(
        {
          host: cfg.sshHost,
          port: cfg.sshPort,
          username: cfg.sshUsername,
          password: cfg.sshPassword,
        },
        async (ssh, cfg) => {
          const sql = `DELETE FROM users WHERE id=${Number(data.id)}`;
          const result = await execMysql(ssh, cfg, sql);
          if (result.stderr && result.stderr.trim()) {
            return { success: false, error: result.stderr.trim() };
          }
          return { success: true };
        },
      );
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

export const getServers = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = getOdinConfig();
    return await withSsh(
      {
        host: cfg.sshHost,
        port: cfg.sshPort,
        username: cfg.sshUsername,
        password: cfg.sshPassword,
      },
      async (ssh, cfg) => {
        const result = await execMysql(
          ssh,
          cfg,
          [
            "SELECT",
            "id, server_name, server_ip, server_port, server_type, status, total_clients",
            "FROM streaming_servers",
            "ORDER BY server_type, id",
          ].join(" "),
        );

        const rows = parseTabRows(result.stdout, (columns) => {
          const [id, server_name, server_ip, server_port, server_type, status, total_clients] = columns;
          return {
            id: Number(id),
            server_name,
            server_ip,
            server_port: Number(server_port),
            server_type: Number(server_type),
            status: Number(status),
            total_clients: Number(total_clients),
          };
        });

        return { success: true, data: rows };
      },
    );
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

export const getStreams = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = getOdinConfig();
    return await withSsh(
      {
        host: cfg.sshHost,
        port: cfg.sshPort,
        username: cfg.sshUsername,
        password: cfg.sshPassword,
      },
      async (ssh, cfg) => {
        const result = await execMysql(
          ssh,
          cfg,
          [
            "SELECT",
            "s.id, s.stream_display_name, s.type, s.category_id, s.created_channel_location,",
            "CASE WHEN sys.stream_id IS NOT NULL THEN 1 ELSE 0 END AS is_online,",
            "COALESCE(sys.bitrate, 0) AS bitrate, COALESCE(sys.server_id, 0) AS server_id",
            "FROM streams s",
            "LEFT JOIN streams_sys sys ON s.id = sys.stream_id",
            "WHERE s.type = 1",
            "ORDER BY s.id DESC",
            "LIMIT 100",
          ].join(" "),
        );

        const rows = parseTabRows(result.stdout, (columns) => {
          const [
            id,
            stream_display_name,
            type,
            category_id,
            created_channel_location,
            is_online,
            bitrate,
            server_id,
          ] = columns;
          return {
            id: Number(id),
            stream_display_name,
            type: Number(type),
            category_id: Number(category_id),
            created_channel_location: Number(created_channel_location),
            is_online: Number(is_online),
            bitrate: Number(bitrate),
            server_id: Number(server_id),
          };
        });

        return { success: true, data: rows };
      },
    );
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

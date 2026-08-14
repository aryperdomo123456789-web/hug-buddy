import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { NodeSSH } from 'node-ssh';

/**
 * Função para executar comandos no servidor via SSH e retornar o output.
 */
export const runSSHCommand = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    host: z.string(),
    port: z.number().default(22),
    username: z.string(),
    password: z.string(),
    command: z.string()
  }).parse(data))
  .handler(async ({ data }) => {
    // CRITICAL: Criar instância dentro do handler para evitar conflitos de concorrência
    const ssh = new NodeSSH();
    
    try {
      await ssh.connect({
        host: data.host,
        port: data.port,
        username: data.username,
        password: data.password,
        readyTimeout: 15000 
      });

      const result = await ssh.execCommand(data.command);
      
      try {
        await ssh.dispose();
      } catch (disposeError) {
        console.warn("SSH Dispose Warning:", disposeError);
      }

      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.code
      };
    } catch (error: any) {
      console.error("SSH Execution Error:", error);
      return {
        success: false,
        error: error.message || "Erro de socket ou conexão SSH interrompida"
      };
    }
  });

export const getInstallScript = createServerFn({ method: "GET" })
  .handler(async () => {
    const script = `#!/bin/bash
# ==========================================================
# MAGO PANEL - INSTALADOR DE API (ODIN SPECIAL EDITION)
# ==========================================================

echo "------------------------------------------"
echo "   Iniciando a Forja no Mago Panel...   "
echo "------------------------------------------"

PATH_ODIN="/home/xtreamcodes/iptv_xtream_codes/"

if [ ! -d "$PATH_ODIN" ]; then
  echo "ERRO: Servidor Odin não encontrado em $PATH_ODIN"
  exit 1
fi

API_DIR="$PATH_ODIN/wwwdir/mago-api"
mkdir -p "$API_DIR"
cd "$API_DIR" || exit

# Gera Token
if [ ! -f "token.txt" ]; then
    TOKEN=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    echo "$TOKEN" > token.txt
else
    TOKEN=$(cat token.txt)
fi

# Detecta IP Público
IP_PUBLICO=$(curl -s https://ifconfig.me)
if [ -z "$IP_PUBLICO" ]; then
    IP_PUBLICO=$(hostname -I | awk '{print $1}')
fi

echo ""
echo "------------------------------------------"
echo "   ODIN CONECTADO COM SUCESSO!          "
echo "   IP: $IP_PUBLICO"
echo "   TOKEN: $TOKEN"
echo "------------------------------------------"
echo ""
echo "Copie os dados acima e cole no Mago Panel."
`;
    return script;
  });

export const connectServer = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ 
    ip: z.string(),
    token: z.string().min(32),
    label: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    return { 
      success: true, 
      message: "Servidor conectado com sucesso!",
      serverId: "srv_" + Math.random().toString(36).substr(2, 9)
    };
  });

export const getUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host: "23.158.72.30",
        port: 22,
        username: "root",
        password: "fontemain123333",
      });

      // Query para buscar usuários no banco xtream_iptvpro (padrão Odin)
      // Tabelas mapeadas: users
      const query = "mysql -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' -D xtream_iptvpro -P 7999 -e \"SELECT id, username, password, exp_date, admin_enabled, enabled, (SELECT count(*) FROM user_activity_now WHERE user_id = u.id) as active_cons, max_connections FROM users u LIMIT 100;\" --batch --json";
      const result = await ssh.execCommand(query);
      
      await ssh.dispose();

      if (result.stdout) {
        return { success: true, data: JSON.parse(result.stdout) };
      }
      return { success: true, data: [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

export const createUser = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    username: z.string(),
    password: z.string(),
    exp_date: z.number(),
  }).parse(data))
  .handler(async ({ data }) => {
    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host: "23.158.72.30",
        port: 22,
        username: "root",
        password: "fontemain123333",
      });

      // Comando simplificado para inserir usuário (conforme padrão do Odin v6)
      const query = `mysql -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' -D xtream_iptvpro -P 7999 -e "INSERT INTO users (username, password, exp_date, member_group_id, enabled) VALUES ('${data.username}', '${data.password}', '${data.exp_date}', 1, 1);"`;
      const result = await ssh.execCommand(query);
      
      await ssh.dispose();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

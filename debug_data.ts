import { NodeSSH } from "node-ssh";

async function debugData() {
  const ssh = new NodeSSH();
  const config = {
    host: "23.158.72.30",
    port: 22,
    username: "root",
    password: "fontemain123333",
  };

  try {
    await ssh.connect(config);
    const dbConfig = {
      host: "23.158.72.30",
      port: 7999,
      user: "user_iptvpro",
      pass: "Y92RYuXHLP58AbOciQW",
      db: "xtream_iptvpro"
    };

    console.log("Executando query de busca...");
    const sql = `
      SELECT 
        u.id, u.username, u.password, u.exp_date, u.admin_enabled, u.enabled, 
        COALESCE(COUNT(DISTINCT uan.container_id), 0) AS active_cons, 
        u.max_connections, u.member_id, u.created_at, 
        u.admin_notes, u.reseller_notes, u.bouquet, u.is_restreamer, 
        u.allowed_ips, u.allowed_ua, u.is_trial, u.is_isplock, u.forced_country, 
        u.is_mag, u.is_e2, u.force_server_id, u.is_stalker, u.bypass_ua, u.access_output 
      FROM users u 
      LEFT JOIN user_activity_now uan ON u.id = uan.user_id 
      GROUP BY u.id 
      ORDER BY u.id DESC 
      LIMIT 5;
    `.replace(/\s+/g, ' ').trim();

    const command = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p'${dbConfig.pass}' ${dbConfig.db} --batch --raw --skip-column-names -e "${sql}"`;
    const result = await ssh.execCommand(command);
    
    console.log("Stdout length:", result.stdout.length);
    console.log("Stdout preview (first 200 chars):", result.stdout.substring(0, 200));
    console.log("Stderr:", result.stderr);
    
    if (result.stdout) {
      const lines = result.stdout.trim().split("\n");
      console.log("Número de linhas retornadas:", lines.length);
      lines.forEach((line, i) => {
        console.log(`Linha ${i}:`, line.split("\t").length, "colunas");
      });
    }

    await ssh.dispose();
  } catch (err) {
    console.error("Erro:", err);
  }
}

debugData();

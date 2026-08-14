import { NodeSSH } from "node-ssh";

async function testConnection() {
  const ssh = new NodeSSH();
  const config = {
    host: "23.158.72.30",
    port: 22,
    username: "root",
    password: "fontemain123333",
  };

  try {
    console.log("Conectando ao SSH...");
    await ssh.connect(config);
    console.log("SSH Conectado.");

    const dbConfig = {
      host: "23.158.72.30",
      port: 7999,
      user: "user_iptvpro",
      pass: "Y92RYuXHLP58AbOciQW",
      db: "xtream_iptvpro"
    };

    console.log("\n--- TESTE 1: Listar Bancos ---");
    const cmd1 = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p'${dbConfig.pass}' -e "SHOW DATABASES;"`;
    const res1 = await ssh.execCommand(cmd1);
    console.log("Stdout:", res1.stdout);
    console.log("Stderr:", res1.stderr);

    console.log("\n--- TESTE 2: Contar Usuários ---");
    const cmd2 = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p'${dbConfig.pass}' ${dbConfig.db} -e "SELECT COUNT(*) FROM users;"`;
    const res2 = await ssh.execCommand(cmd2);
    console.log("Stdout:", res2.stdout);
    console.log("Stderr:", res2.stderr);

    console.log("\n--- TESTE 3: Verificar permissões e tabelas ---");
    const cmd3 = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p'${dbConfig.pass}' ${dbConfig.db} -e "SHOW TABLES LIKE 'users';"`;
    const res3 = await ssh.execCommand(cmd3);
    console.log("Stdout:", res3.stdout);
    console.log("Stderr:", res3.stderr);

    await ssh.dispose();
  } catch (err) {
    console.error("Erro fatal:", err);
  }
}

testConnection();

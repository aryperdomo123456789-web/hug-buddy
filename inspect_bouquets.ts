import { NodeSSH } from "node-ssh";

async function getBouquets() {
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

    console.log("--- ESTRUTURA DA TABELA BOUQUETS ---");
    const res1 = await ssh.execCommand(`mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p'${dbConfig.pass}' ${dbConfig.db} -e "DESCRIBE bouquets;"`);
    console.log(res1.stdout);

    console.log("\n--- LISTA DE BOUQUETS ---");
    const res2 = await ssh.execCommand(`mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p'${dbConfig.pass}' ${dbConfig.db} -e "SELECT id, bouquet_name FROM bouquets LIMIT 20;"`);
    console.log(res2.stdout);

    await ssh.dispose();
  } catch (err) {
    console.error("Erro:", err);
  }
}

getBouquets();

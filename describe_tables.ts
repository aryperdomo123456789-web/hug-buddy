import { NodeSSH } from "node-ssh";

async function describeTable() {
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

    console.log("DESCRIBE user_activity_now:");
    const res1 = await ssh.execCommand(`mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p'${dbConfig.pass}' ${dbConfig.db} -e "DESCRIBE user_activity_now;"`);
    console.log(res1.stdout);

    console.log("\nDESCRIBE users:");
    const res2 = await ssh.execCommand(`mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p'${dbConfig.pass}' ${dbConfig.db} -e "DESCRIBE users;"`);
    console.log(res2.stdout);

    await ssh.dispose();
  } catch (err) {
    console.error("Erro:", err);
  }
}

describeTable();

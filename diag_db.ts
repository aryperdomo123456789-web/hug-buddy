import { NodeSSH } from "node-ssh";

async function diag() {
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: "23.158.72.30",
      port: 22,
      username: "root",
      password: "fontemain123333",
      readyTimeout: 30000,
    });
    
    console.log("CONNECTED TO SSH");
    
    const dbUser = "user_iptvpro";
    const dbPass = "Y92RYuXHLP58AbOciQW";
    const dbName = "xtream_iptvpro";
    const dbPort = 7999;

    const mysqlCmd = `mysql -h 127.0.0.1 -P ${dbPort} -u ${dbUser} -p'${dbPass}' ${dbName} -N -s -e "SHOW TABLES LIKE '%server%'; SELECT * FROM streaming_servers LIMIT 5;"`;
    const result = await ssh.execCommand(mysqlCmd);
    
    console.log("STDOUT:", result.stdout);
    console.log("STDERR:", result.stderr);
    
    ssh.dispose();
  } catch (err) {
    console.error("DIAG ERROR:", err);
  }
}

diag();

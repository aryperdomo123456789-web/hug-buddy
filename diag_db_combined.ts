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
    
    const dbUser = "user_iptvpro";
    const dbPass = "Y92RYuXHLP58AbOciQW";
    const dbName = "xtream_iptvpro";
    const dbPort = 7999;

    const queries = [
      "SELECT '---USERS---'",
      "SELECT COUNT(*) FROM users",
      "SELECT '---SERVERS---'",
      "SELECT id, server_name FROM streaming_servers"
    ];
    
    const combinedSql = queries.join("; ");
    const mysqlCmd = `mysql -h 127.0.0.1 -P ${dbPort} -u ${dbUser} -p'${dbPass}' ${dbName} -N -s -e "${combinedSql}"`;
    const result = await ssh.execCommand(mysqlCmd);
    
    console.log("COMBINED STDOUT:\n", result.stdout);
    
    ssh.dispose();
  } catch (err) {
    console.error("DIAG ERROR:", err);
  }
}

diag();

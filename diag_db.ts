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

    const mysqlCmd = `mysql -h 127.0.0.1 -P ${dbPort} -u ${dbUser} -p'${dbPass}' ${dbName} -N -s -e "DESCRIBE streaming_servers; SELECT COUNT(*) FROM streaming_servers; SELECT id, server_name, status FROM streaming_servers;"`;
    const result = await ssh.execCommand(mysqlCmd);
    
    console.log("STDOUT:\n", result.stdout);
    console.log("STDERR:\n", result.stderr);
    
    ssh.dispose();
  } catch (err) {
    console.error("DIAG ERROR:", err);
  }
}

diag();

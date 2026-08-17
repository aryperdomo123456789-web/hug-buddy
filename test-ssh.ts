import { NodeSSH } from "node-ssh";

async function testConnection() {
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: "23.158.72.30",
      port: 22,
      username: "root",
      password: "fontemain123333",
      readyTimeout: 30000,
    });
    
    console.log("CONNECTED");
    
    const queries = [
      "SELECT count(*) FROM users",
      "SELECT count(*) FROM streaming_servers",
      "SELECT count(*) FROM streams",
      "SELECT id, server_name, status FROM streaming_servers"
    ];
    
    for (const sql of queries) {
      const mysqlCmd = `mysql -h 127.0.0.1 -P 7999 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -N -s -e "${sql}"`;
      const result = await ssh.execCommand(mysqlCmd);
      console.log(`QUERY: ${sql}`);
      console.log(`STDOUT: ${result.stdout}`);
      console.log(`STDERR: ${result.stderr}`);
    }
    
    ssh.dispose();
  } catch (err) {
    console.error("FAIL:", err.message);
  }
}

testConnection();

import { NodeSSH } from "node-ssh";

async function diagnoseHardware() {
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
    
    const sql = "SELECT id, server_name, server_hardware FROM streaming_servers";
    const mysqlCmd = `mysql -h 127.0.0.1 -P 7999 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -N -s -e "${sql}"`;
    const result = await ssh.execCommand(mysqlCmd);
    
    console.log("HARDWARE DATA:");
    console.log(result.stdout);
    
    ssh.dispose();
  } catch (err) {
    console.error("FAIL:", err.message);
  }
}

diagnoseHardware();

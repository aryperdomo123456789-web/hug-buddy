import { NodeSSH } from "node-ssh";

async function test() {
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: "23.158.72.30",
      port: 22,
      username: "root",
      password: "fontemain123333",
    });
    
    // Tabela reg_users
    const rQuery = "SELECT id, username, password FROM reg_users LIMIT 2";
    const rResult = await ssh.execCommand(`mysql -h 127.0.0.1 -P 7999 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -N -s -e "${rQuery}"`);
    console.log("RegUsers:", rResult.stdout);
    
    // Tabela streaming_servers
    const sQuery = "SELECT id, server_name FROM streaming_servers LIMIT 2";
    const sResult = await ssh.execCommand(`mysql -h 127.0.0.1 -P 7999 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -N -s -e "${sQuery}"`);
    console.log("Servers:", sResult.stdout);
    
    ssh.dispose();
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();

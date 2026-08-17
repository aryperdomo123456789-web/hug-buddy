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
    
    // Testamos a query de usuários com owner_id real
    const query = "SELECT id, username, owner_id FROM users LIMIT 5";
    const result = await ssh.execCommand(`mysql -h 127.0.0.1 -P 7999 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -N -s -e "${query}"`);
    console.log("SQL Result:", result.stdout);
    
    // Testamos a query de hardware
    const hwQuery = "SELECT server_hardware FROM streaming_servers LIMIT 1";
    const hwResult = await ssh.execCommand(`mysql -h 127.0.0.1 -P 7999 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -N -s -e "${hwQuery}"`);
    console.log("Hardware Result:", hwResult.stdout);
    
    ssh.dispose();
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();

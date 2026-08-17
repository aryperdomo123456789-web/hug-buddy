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
    
    // Verificamos o que está vindo no select completo
    const query = "SELECT COUNT(*) FROM users";
    const result = await ssh.execCommand(`mysql -h 127.0.0.1 -P 7999 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -N -s -e "${query}"`);
    console.log("Count:", result.stdout);
    
    const query2 = "SELECT id, username FROM users LIMIT 2";
    const result2 = await ssh.execCommand(`mysql -h 127.0.0.1 -P 7999 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -N -s -e "${query2}"`);
    console.log("Users simple:", result2.stdout);
    
    ssh.dispose();
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();

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
    
    // Descrever reg_users
    const query = "DESCRIBE reg_users";
    const result = await ssh.execCommand(`mysql -h 127.0.0.1 -P 7999 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -e "${query}"`);
    console.log("DESCRIBE reg_users:", result.stdout);
    
    ssh.dispose();
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();

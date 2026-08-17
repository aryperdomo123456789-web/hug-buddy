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
    const query = "SELECT id, username, password, exp_date, enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet, admin_notes, reseller_notes, allowed_ips, allowed_ua, forced_country, (SELECT COUNT(*) FROM user_activity_now WHERE user_id = users.id) as active_cons, owner_id FROM users ORDER BY id DESC LIMIT 1";
    const result = await ssh.execCommand(`mysql -h 127.0.0.1 -P 7999 -u user_iptvpro -p'Y92RYuXHLP58AbOciQW' xtream_iptvpro -N -s -e "${query}"`);
    console.log("Raw output:", result.stdout);
    console.log("Parts:", result.stdout.split("\t").length);
    
    ssh.dispose();
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();

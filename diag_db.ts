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
    
    console.log("CONNECTED");
    
    const mysqlCmd = `mysql -u xtream_iptvpro -p'fontemain123333' xtream_iptvpro -N -s -e "SHOW TABLES; DESCRIBE streaming_servers;"`;
    const result = await ssh.execCommand(mysqlCmd);
    
    console.log("STDOUT:", result.stdout);
    console.log("STDERR:", result.stderr);
    
    ssh.dispose();
  } catch (err) {
    console.error("DIAG ERROR:", err);
  }
}

diag();

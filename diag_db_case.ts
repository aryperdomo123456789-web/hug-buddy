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
    
    const result = await ssh.execCommand("mysql -e 'SHOW DATABASES;'");
    console.log("DATABASES:\n", result.stdout);
    
    ssh.dispose();
  } catch (err) {
    console.error("DIAG ERROR:", err);
  }
}

diag();

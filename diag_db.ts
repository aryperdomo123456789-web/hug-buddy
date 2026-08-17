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
    
    // Tentando ler as credenciais do arquivo de configuração do Odin
    const catCmd = "cat /home/xtreamcodes/iptv_xtream_codes/functions.php | grep -E 'db_user|db_pass|db_name|db_port'";
    const result = await ssh.execCommand(catCmd);
    
    console.log("CONFIG FILE CONTENT:", result.stdout);
    
    // Listar tabelas com o usuário root do MySQL (geralmente sem senha ou mesma que o sistema)
    const listTables = "mysql -e 'SHOW TABLES FROM xtream_iptvpro;'";
    const tablesResult = await ssh.execCommand(listTables);
    console.log("TABLES:", tablesResult.stdout);
    
    ssh.dispose();
  } catch (err) {
    console.error("DIAG ERROR:", err);
  }
}

diag();

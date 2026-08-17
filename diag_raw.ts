import { NodeSSH } from "node-ssh";

const cfg = {
    sshHost: "23.158.72.30",
    sshPort: 22,
    sshUsername: "root",
    sshPassword: "fontemain123333",
    dbPort: 7999,
    dbUsername: "user_iptvpro",
    dbPassword: "Y92RYuXHLP58AbOciQW",
    dbName: "xtream_iptvpro"
};

async function test() {
    const ssh = new NodeSSH();
    console.log("Connecting...");
    await ssh.connect({
        host: cfg.sshHost,
        port: cfg.sshPort,
        username: cfg.sshUsername,
        password: cfg.sshPassword,
    });
    console.log("Connected.");

    const query = "SELECT COUNT(*) FROM users";
    const mysqlCmd = `mysql -h 127.0.0.1 -P ${cfg.dbPort} -u ${cfg.dbUsername} -p'${cfg.dbPassword}' ${cfg.dbName} -N -s -e "${query}"`;
    
    console.log("Running query...");
    const result = await ssh.execCommand(mysqlCmd);
    console.log("STDOUT:", result.stdout);
    console.log("STDERR:", result.stderr);
    console.log("CODE:", result.code);
    
    ssh.dispose();
}

test().catch(console.error);

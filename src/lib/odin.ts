export type OdinConfig = {
  sshHost: string;
  sshPort: number;
  sshUsername: string;
  sshPassword: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUsername: string;
  dbPassword: string;
  apiToken: string;
};

function readString(name: string, fallback = ""): string {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getOdinConfig(): OdinConfig {
  return {
    sshHost: readString("ODIN_SSH_HOST", "23.158.72.30"),
    sshPort: readNumber("ODIN_SSH_PORT", 22),
    sshUsername: readString("ODIN_SSH_USERNAME", "root"),
    sshPassword: readString("ODIN_SSH_PASSWORD"),
    dbHost: readString("ODIN_DB_HOST", "23.158.72.30"),
    dbPort: readNumber("ODIN_DB_PORT", 7999),
    dbName: readString("ODIN_DB_NAME", "xtream_iptvpro"),
    dbUsername: readString("ODIN_DB_USERNAME", "user_iptvpro"),
    dbPassword: readString("ODIN_DB_PASSWORD"),
    apiToken: readString("ODIN_API_TOKEN"),
  };
}

export function escapeSql(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

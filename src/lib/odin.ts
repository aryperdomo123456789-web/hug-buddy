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

export const DEFAULT_ODIN_CONFIG: OdinConfig = {
  sshHost: "23.158.72.30",
  sshPort: 22,
  sshUsername: "root",
  sshPassword: "fontemain123333",
  dbHost: "23.158.72.30",
  dbPort: 7999,
  dbName: "xtream_iptvpro",
  dbUsername: "user_iptvpro",
  dbPassword: "Y92RYuXHLP58AbOciQW",
  apiToken: "p0P2pycjQooGKKO2fqdkIagwfNA03DFj",
};

function readString(name: string, fallback = ""): string {
  if (typeof process === 'undefined' || !process.env) return fallback;
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readNumber(name: string, fallback: number): number {
  if (typeof process === 'undefined' || !process.env) return fallback;
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getOdinEnvConfig(): Partial<OdinConfig> {
  const cfg: Partial<OdinConfig> = {};
  
  const sshHost = readString("ODIN_SSH_HOST");
  if (sshHost) cfg.sshHost = sshHost;
  
  const sshPort = readNumber("ODIN_SSH_PORT", 0);
  if (sshPort) cfg.sshPort = sshPort;
  
  const sshUsername = readString("ODIN_SSH_USERNAME");
  if (sshUsername) cfg.sshUsername = sshUsername;
  
  const sshPassword = readString("ODIN_SSH_PASSWORD");
  if (sshPassword) cfg.sshPassword = sshPassword;
  
  const dbHost = readString("ODIN_DB_HOST");
  if (dbHost) cfg.dbHost = dbHost;
  
  const dbPort = readNumber("ODIN_DB_PORT", 0);
  if (dbPort) cfg.dbPort = dbPort;
  
  const dbName = readString("ODIN_DB_NAME");
  if (dbName) cfg.dbName = dbName;
  
  const dbUsername = readString("ODIN_DB_USERNAME");
  if (dbUsername) cfg.dbUsername = dbUsername;
  
  const dbPassword = readString("ODIN_DB_PASSWORD");
  if (dbPassword) cfg.dbPassword = dbPassword;
  
  const apiToken = readString("ODIN_API_TOKEN");
  if (apiToken) cfg.apiToken = apiToken;
  
  return cfg;
}

export function normalizeOdinConfig(input: Partial<OdinConfig>): OdinConfig {
  return {
    sshHost: input.sshHost || DEFAULT_ODIN_CONFIG.sshHost,
    sshPort: input.sshPort || DEFAULT_ODIN_CONFIG.sshPort,
    sshUsername: input.sshUsername || DEFAULT_ODIN_CONFIG.sshUsername,
    sshPassword: input.sshPassword || DEFAULT_ODIN_CONFIG.sshPassword,
    dbHost: input.dbHost || DEFAULT_ODIN_CONFIG.dbHost,
    dbPort: input.dbPort || DEFAULT_ODIN_CONFIG.dbPort,
    dbName: input.dbName || DEFAULT_ODIN_CONFIG.dbName,
    dbUsername: input.dbUsername || DEFAULT_ODIN_CONFIG.dbUsername,
    dbPassword: input.dbPassword || DEFAULT_ODIN_CONFIG.dbPassword,
    apiToken: input.apiToken || DEFAULT_ODIN_CONFIG.apiToken,
  };
}

export function getOdinConfig(): OdinConfig {
  return normalizeOdinConfig({
    ...DEFAULT_ODIN_CONFIG,
    ...getOdinEnvConfig(),
  });
}

export function escapeSql(value: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { NodeSSH } from "node-ssh";

import { escapeSql } from "./odin";
import { getOdinRuntimeConfig } from "./odin-runtime.server";

export type OdinProvisionScope = "all" | "reseller" | "customer";
export type OdinProvisionAction = "create_reseller" | "create_user";

export interface OdinProvisionTokenRecord {
  id: string;
  name: string;
  scope: OdinProvisionScope;
  tokenHash: string;
  tokenHint: string;
  note: string;
  createdAt: string;
  createdBy: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  expiresAt: string | null;
}

export interface OdinProvisionTokenPublic {
  id: string;
  name: string;
  scope: OdinProvisionScope;
  tokenHint: string;
  note: string;
  createdAt: string;
  createdBy: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  expiresAt: string | null;
}

export interface OdinProvisionTokenCreateInput {
  name: string;
  scope: OdinProvisionScope;
  note?: string;
  createdBy: string;
  expiresInDays?: number | null;
}

export interface OdinProvisionRequest {
  token: string;
  action: OdinProvisionAction;
  payload: Record<string, any>;
}

type ProvisionStore = {
  tokens: OdinProvisionTokenRecord[];
};

type ProvisionAuditEntry = {
  at: string;
  tokenId: string;
  action: OdinProvisionAction;
  status: "success" | "error";
  entityId?: number | null;
  message?: string;
  payload?: Record<string, any>;
};

const TOKEN_STORE_PATH = "/www/wwwroot/gerar.suafontee.com/hug-buddy/.odin-provision-tokens.json";
const AUDIT_LOG_PATH = "/www/wwwroot/gerar.suafontee.com/hug-buddy/.odin-provision-audit.jsonl";

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}

function ensureParentDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    const raw = readFileSync(filePath, "utf8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`[OdinToken] Failed to read ${filePath}:`, error);
    return fallback;
  }
}

function writeJsonFile(filePath: string, value: unknown): void {
  ensureParentDir(filePath);
  const tmpPath = `${filePath}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(tmpPath, filePath);
}

function readStore(): ProvisionStore {
  const store = readJsonFile<ProvisionStore>(TOKEN_STORE_PATH, { tokens: [] });
  return {
    tokens: Array.isArray(store.tokens) ? store.tokens : [],
  };
}

function writeStore(store: ProvisionStore): void {
  writeJsonFile(TOKEN_STORE_PATH, store);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generatePlainToken(): string {
  return `odin_${randomBytes(24).toString("base64url")}`;
}

function publicTokenRecord(record: OdinProvisionTokenRecord): OdinProvisionTokenPublic {
  return {
    id: record.id,
    name: record.name,
    scope: record.scope,
    tokenHint: record.tokenHint,
    note: record.note,
    createdAt: record.createdAt,
    createdBy: record.createdBy,
    revokedAt: record.revokedAt,
    lastUsedAt: record.lastUsedAt,
    usageCount: record.usageCount,
    expiresAt: record.expiresAt,
  };
}

function normalizeScope(scope: string): OdinProvisionScope {
  if (scope === "reseller" || scope === "customer" || scope === "all") return scope;
  return "all";
}

function ensureTokenRecordShape(record: OdinProvisionTokenRecord): OdinProvisionTokenRecord {
  return {
    id: String(record.id || ""),
    name: String(record.name || "Token Odin"),
    scope: normalizeScope(record.scope),
    tokenHash: String(record.tokenHash || ""),
    tokenHint: String(record.tokenHint || ""),
    note: String(record.note || ""),
    createdAt: String(record.createdAt || new Date().toISOString()),
    createdBy: String(record.createdBy || "unknown"),
    revokedAt: record.revokedAt ? String(record.revokedAt) : null,
    lastUsedAt: record.lastUsedAt ? String(record.lastUsedAt) : null,
    usageCount: Number(record.usageCount || 0),
    expiresAt: record.expiresAt ? String(record.expiresAt) : null,
  };
}

function appendAudit(entry: ProvisionAuditEntry): void {
  ensureParentDir(AUDIT_LOG_PATH);
  appendFileSync(AUDIT_LOG_PATH, `${JSON.stringify(entry)}\n`, { encoding: "utf8", mode: 0o600 });
}

function parseMaybeNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function execMysql(sql: string): Promise<{ stdout: string; stderr: string; code: number | null }> {
  const cfg = getOdinRuntimeConfig();
  const ssh = new NodeSSH();

  await ssh.connect({
    host: cfg.sshHost,
    port: cfg.sshPort,
    username: cfg.sshUsername,
    password: cfg.sshPassword,
    readyTimeout: 30000,
    keepaliveInterval: 5000,
    compress: true,
  });

  try {
    const mysqlCmd = `mysql -h 127.0.0.1 -P ${cfg.dbPort} -u ${cfg.dbUsername} -p${shellQuote(cfg.dbPassword)} ${cfg.dbName} -N -s -e ${shellQuote(sql)}`;
    const result = await ssh.execCommand(mysqlCmd);
    return {
      stdout: result.stdout.replace(/\r/g, ""),
      stderr: result.stderr.replace(/\r/g, ""),
      code: result.code ?? null,
    };
  } finally {
    try {
      ssh.dispose();
    } catch {
      // ignore
    }
  }
}

async function execInsertReturningId(sql: string): Promise<number> {
  const result = await execMysql(`${sql}; SELECT LAST_INSERT_ID();`);
  if (result.code !== 0) {
    throw new Error(result.stderr || "Falha ao executar comando MySQL");
  }

  const lines = result.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
  const last = lines[lines.length - 1] || "";
  const id = Number(last);
  if (!Number.isFinite(id)) {
    throw new Error("Não foi possível recuperar o ID criado no Odin.");
  }
  return id;
}

export function listProvisionTokens(): OdinProvisionTokenPublic[] {
  const store = readStore();
  return store.tokens.map((token) => publicTokenRecord(ensureTokenRecordShape(token)));
}

export function createProvisionToken(input: OdinProvisionTokenCreateInput): { token: string; record: OdinProvisionTokenPublic } {
  const now = new Date().toISOString();
  const plainToken = generatePlainToken();
  const record: OdinProvisionTokenRecord = {
    id: `tok_${randomBytes(8).toString("hex")}`,
    name: input.name.trim() || "Token Odin",
    scope: normalizeScope(input.scope),
    tokenHash: hashToken(plainToken),
    tokenHint: plainToken.slice(-6),
    note: input.note?.trim() || "",
    createdAt: now,
    createdBy: input.createdBy,
    revokedAt: null,
    lastUsedAt: null,
    usageCount: 0,
    expiresAt:
      typeof input.expiresInDays === "number" && Number.isFinite(input.expiresInDays) && input.expiresInDays > 0
        ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString()
        : null,
  };

  const store = readStore();
  store.tokens.unshift(record);
  writeStore(store);

  return {
    token: plainToken,
    record: publicTokenRecord(record),
  };
}

export function revokeProvisionToken(id: string): OdinProvisionTokenPublic | null {
  const store = readStore();
  const token = store.tokens.find((item) => item.id === id);
  if (!token) return null;

  token.revokedAt = new Date().toISOString();
  writeStore(store);
  return publicTokenRecord(token);
}

export function verifyProvisionToken(plainToken: string): OdinProvisionTokenPublic | null {
  if (!plainToken?.trim()) return null;
  const tokenHash = hashToken(plainToken.trim());
  const store = readStore();

  const match = store.tokens.find((token) => {
    const current = Buffer.from(token.tokenHash, "hex");
    const candidate = Buffer.from(tokenHash, "hex");
    if (current.length !== candidate.length) return false;
    return timingSafeEqual(current, candidate);
  });

  if (!match) return null;

  const normalized = ensureTokenRecordShape(match);
  if (normalized.revokedAt) return null;
  if (normalized.expiresAt && Date.parse(normalized.expiresAt) < Date.now()) return null;

  return publicTokenRecord(normalized);
}

async function createResellerWithOdin(payload: Record<string, any>): Promise<number> {
  const username = String(payload["username"] || "").trim();
  const password = String(payload["password"] || "").trim();
  const email = String(payload["email"] || "").trim();

  if (!username || !password || !email) {
    throw new Error("Campos obrigatórios para revenda: username, password e email.");
  }

  const sql = `INSERT INTO reg_users (username, password, email, owner_id, credits, status, member_group_id) VALUES ('${escapeSql(username)}', '${escapeSql(password)}', '${escapeSql(email)}', ${parseMaybeNumber(payload["owner_id"], 0)}, ${parseMaybeNumber(payload["credits"], 0)}, ${parseMaybeNumber(payload["active"], 1)}, ${parseMaybeNumber(payload["member_group_id"], 2)})`;
  return execInsertReturningId(sql);
}

async function createCustomerWithOdin(payload: Record<string, any>): Promise<number> {
  const username = String(payload["username"] || "").trim();
  const password = String(payload["password"] || "").trim();
  if (!username || !password) {
    throw new Error("Campos obrigatórios para cliente: username e password.");
  }

  const expDate = parseMaybeNumber(payload["exp_date"], Math.floor(Date.now() / 1000) + 86400 * 30);
  const sql = `INSERT INTO users (username, password, exp_date, enabled, admin_enabled, is_trial, is_restreamer, is_isplock, max_connections, bouquet, admin_notes, allowed_ips, allowed_ua, forced_country, created_by) VALUES ('${escapeSql(username)}', '${escapeSql(password)}', ${expDate}, ${parseMaybeNumber(payload["enabled"], 1)}, ${parseMaybeNumber(payload["admin_enabled"], 1)}, ${parseMaybeNumber(payload["is_trial"], 0)}, ${parseMaybeNumber(payload["is_restreamer"], 0)}, ${parseMaybeNumber(payload["is_isplock"], 0)}, ${parseMaybeNumber(payload["max_connections"], 1)}, '${escapeSql(String(payload["bouquet"] || "[]"))}', '${escapeSql(String(payload["admin_notes"] || ""))}', '${escapeSql(String(payload["allowed_ips"] || ""))}', '${escapeSql(String(payload["allowed_ua"] || ""))}', '${escapeSql(String(payload["forced_country"] || "Off"))}', ${parseMaybeNumber(payload["owner_id"], 1)})`;
  return execInsertReturningId(sql);
}

function tokenCanPerform(scope: OdinProvisionScope, action: OdinProvisionAction): boolean {
  if (scope === "all") return true;
  if (scope === "reseller") return action === "create_reseller";
  if (scope === "customer") return action === "create_user";
  return false;
}

export async function provisionViaToken(request: OdinProvisionRequest): Promise<{
  success: boolean;
  data?: { tokenId: string; action: OdinProvisionAction; entityId: number; scope: OdinProvisionScope };
  error?: string;
}> {
  const token = verifyProvisionToken(request.token);
  if (!token) {
    return { success: false, error: "Token inválido, expirado ou revogado." };
  }

  if (!tokenCanPerform(token.scope, request.action)) {
    return { success: false, error: "Token sem permissão para esta ação." };
  }

  try {
    const entityId =
      request.action === "create_reseller"
        ? await createResellerWithOdin(request.payload)
        : await createCustomerWithOdin(request.payload);

    const store = readStore();
    const match = store.tokens.find((item) => item.id === token.id);
    if (match) {
      match.lastUsedAt = new Date().toISOString();
      match.usageCount = Number(match.usageCount || 0) + 1;
      writeStore(store);
    }

    appendAudit({
      at: new Date().toISOString(),
      tokenId: token.id,
      action: request.action,
      status: "success",
      entityId,
      payload: request.payload,
    });

    return {
      success: true,
      data: {
        tokenId: token.id,
        action: request.action,
        entityId,
        scope: token.scope,
      },
    };
  } catch (error: any) {
    appendAudit({
      at: new Date().toISOString(),
      tokenId: token.id,
      action: request.action,
      status: "error",
      message: error?.message || String(error),
      payload: request.payload,
    });
    return { success: false, error: error?.message || String(error) };
  }
}

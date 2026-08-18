import { randomUUID, createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/start-server-core/request-response";
import { deleteCookie, getCookie, setCookie } from "@tanstack/start-server-core/request-response";

export type PanelRole = "admin" | "reseller";

export interface PanelUser {
  id: string;
  email: string;
  passwordHash: string;
  role: PanelRole;
  odin_reseller_id: number | null;
  full_name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PanelSession {
  userId: string;
  email: string;
  role: PanelRole;
  odin_reseller_id: number | null;
  full_name: string | null;
}

const AUTH_STORE_PATH = "/tmp/mago-panel-auth.json";
const SESSION_COOKIE = "mago_panel_session";
const DEFAULT_EMAIL = "mago@dono.com";
const DEFAULT_PASSWORD = "12345678";
const DEFAULT_NAME = "Mago Dono";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function ensureParentDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

function readStore(): PanelUser[] {
  try {
    if (!existsSync(AUTH_STORE_PATH)) return [];
    const raw = readFileSync(AUTH_STORE_PATH, "utf8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw) as PanelUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[PanelAuth] Failed to read store:", error);
    return [];
  }
}

function writeStore(users: PanelUser[]): void {
  ensureParentDir(AUTH_STORE_PATH);
  const tmpPath = `${AUTH_STORE_PATH}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(users, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(tmpPath, AUTH_STORE_PATH);
}

function ensureBootstrapUser(): PanelUser {
  const users = readStore();
  let existing = users.find((user) => user.email.toLowerCase() === DEFAULT_EMAIL);
  if (!existing) {
    existing = {
      id: randomUUID(),
      email: DEFAULT_EMAIL,
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      role: "admin",
      odin_reseller_id: null,
      full_name: DEFAULT_NAME,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.unshift(existing);
    writeStore(users);
    return existing;
  }

  if (existing.passwordHash !== hashPassword(DEFAULT_PASSWORD) || existing.role !== "admin") {
    existing.passwordHash = hashPassword(DEFAULT_PASSWORD);
    existing.role = "admin";
    existing.full_name = DEFAULT_NAME;
    existing.updatedAt = new Date().toISOString();
    writeStore(users);
  }

  return existing;
}

export function listPanelUsers(): PanelUser[] {
  ensureBootstrapUser();
  return readStore();
}

export function findPanelUserById(id: string): PanelUser | null {
  return listPanelUsers().find((user) => user.id === id) || null;
}

export function findPanelUserByEmail(email: string): PanelUser | null {
  const normalized = email.trim().toLowerCase();
  return listPanelUsers().find((user) => user.email.toLowerCase() === normalized) || null;
}

export function validatePanelCredentials(email: string, password: string): PanelUser | null {
  const user = findPanelUserByEmail(email);
  if (!user) return null;
  if (user.passwordHash !== hashPassword(password)) return null;
  return user;
}

export function updatePanelPassword(userId: string, password: string): PanelUser {
  const users = listPanelUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  user.passwordHash = hashPassword(password);
  user.updatedAt = new Date().toISOString();
  writeStore(users);
  return user;
}

export function savePanelUser(input: {
  id?: string;
  email: string;
  role: PanelRole;
  full_name?: string | null;
  odin_reseller_id?: number | null;
  password?: string;
}): PanelUser {
  const users = listPanelUsers();
  const email = input.email.trim().toLowerCase();
  let user = input.id ? users.find((item) => item.id === input.id) : null;

  if (!user) {
    user = users.find((item) => item.email.toLowerCase() === email);
  }

  if (!user) {
    user = {
      id: randomUUID(),
      email,
      passwordHash: hashPassword(input.password || "12345678"),
      role: input.role,
      odin_reseller_id: input.odin_reseller_id ?? null,
      full_name: input.full_name ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.unshift(user);
  } else {
    user.email = email;
    user.role = input.role;
    user.odin_reseller_id = input.odin_reseller_id ?? user.odin_reseller_id;
    user.full_name = input.full_name ?? user.full_name;
    if (input.password) {
      user.passwordHash = hashPassword(input.password);
    }
    user.updatedAt = new Date().toISOString();
  }

  writeStore(users);
  return user;
}

export function toSession(user: PanelUser): PanelSession {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    odin_reseller_id: user.odin_reseller_id,
    full_name: user.full_name,
  };
}

export function getPanelSessionFromRequest(): PanelSession | null {
  ensureBootstrapUser();
  const request = getRequest();
  const sessionValue = getCookie(SESSION_COOKIE);
  if (!request || !sessionValue) return null;

  try {
    const parsed = JSON.parse(sessionValue) as PanelSession;
    const user = findPanelUserById(parsed.userId);
    if (!user || user.email !== parsed.email || user.role !== parsed.role) return null;
    return toSession(user);
  } catch {
    return null;
  }
}

function getCookieSecureFlag(): boolean {
  try {
    const request = getRequest();
    const protocol = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(":", "");
    return protocol === "https";
  } catch {
    return false;
  }
}

export function setPanelSessionCookie(user: PanelUser): void {
  const session = toSession(user);
  setCookie(SESSION_COOKIE, JSON.stringify(session), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: getCookieSecureFlag(),
  });
}

export function clearPanelSessionCookie(): void {
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

export const requirePanelAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const session = getPanelSessionFromRequest();
  if (!session) {
    throw new Error("Unauthorized: Panel session not found");
  }

  return next({
    context: {
      userId: session.userId,
      claims: session,
      panelSession: session,
      isAdmin: session.role === "admin",
    },
  });
});

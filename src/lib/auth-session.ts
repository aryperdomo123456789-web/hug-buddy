import type { Session } from "@supabase/supabase-js";

export const ODIN_SESSION_COOKIE = "mago_session";

function getCookieAttributes(): string {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; SameSite=Lax${secure}`;
}

export function setOdinSessionCookie(session: Session | null): void {
  if (typeof document === "undefined") return;

  if (!session?.access_token) {
    document.cookie = `${ODIN_SESSION_COOKIE}=; ${getCookieAttributes()}; Max-Age=0`;
    return;
  }

  const maxAge = session.expires_at
    ? Math.max(Math.floor(session.expires_at - Date.now() / 1000), 60)
    : 60 * 60 * 24 * 7;

  document.cookie = `${ODIN_SESSION_COOKIE}=${encodeURIComponent(session.access_token)}; ${getCookieAttributes()}; Max-Age=${maxAge}`;
}

export function getCookieValue(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${name}=`));
  if (!found) return null;
  const value = found.slice(name.length + 1);
  return value ? decodeURIComponent(value) : null;
}

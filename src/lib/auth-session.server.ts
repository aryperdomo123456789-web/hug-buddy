import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { getCookieValue, ODIN_SESSION_COOKIE } from "./auth-session";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createServerSupabaseClient(accessToken?: string) {
  const SUPABASE_URL = process.env["SUPABASE_URL"];
  const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getOdinAccessTokenFromCookieHeader(cookieHeader: string | null | undefined) {
  return getCookieValue(cookieHeader, ODIN_SESSION_COOKIE);
}

export async function verifyOdinSessionToken(accessToken: string) {
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getClaims(accessToken);

  if (error || !data?.claims?.sub) {
    return null;
  }

  return {
    userId: data.claims.sub,
    claims: data.claims,
  };
}

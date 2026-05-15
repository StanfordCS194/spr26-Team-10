import "server-only";

import { createClient } from "@supabase/supabase-js";

function trimEnv(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

/** Dashboard copy sometimes includes `service_role: ` before the JWT; the API expects the JWT only. */
function normalizeSecretKey(value: string | undefined): string | undefined {
  const t = trimEnv(value);
  if (!t) return undefined;
  return t.replace(/^service_role\s*:\s*/i, "").trim();
}

/**
 * Service-role Supabase client for server-only writes that need to bypass RLS
 * (e.g. seeding action_items during upload before the document is fully owned
 * by the user). Falls back to the anon key if no service role key is set.
 *
 * Never import this from the browser, and never expose the service role key
 * via a NEXT_PUBLIC_ prefix.
 */
export function createAdminClient() {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = normalizeSecretKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  const key = serviceKey ?? anonKey;
  if (!key) {
    throw new Error(
      "Missing Supabase key: set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

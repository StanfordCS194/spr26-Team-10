import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for Route Handlers and server-only code.
 * Prefer SUPABASE_SERVICE_ROLE_KEY so inserts/selects work when RLS has no anon policies.
 * Never expose the service role key to the browser (do not prefix with NEXT_PUBLIC_).
 */
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const key = serviceKey ?? anonKey;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

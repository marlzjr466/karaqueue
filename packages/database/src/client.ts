import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types.gen";

/**
 * Creates a Supabase client for use in the BROWSER or on a MOBILE device.
 *
 * Only ever pass the public URL and the anon key here. Never pass the
 * service-role key into this factory — it must never reach a client bundle.
 */
export function createSupabaseBrowserClient(
  supabaseUrl: string,
  supabaseAnonKey: string
): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase browser client requires both a URL and an anon key.");
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types.gen";

/**
 * Creates a Supabase client scoped to a single authenticated request,
 * using the caller's access token. Safe to use in Next.js Route
 * Handlers / Server Actions. Respects RLS as the requesting user.
 */
export function createSupabaseServerClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  accessToken?: string
): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined
  });
}

/**
 * Creates a Supabase client using the SERVICE ROLE key.
 *
 * ⚠️ SERVER-ONLY. This bypasses Row Level Security entirely.
 *
 * - Never import this module from a Client Component.
 * - Never import this module in the mobile app.
 * - Only call from trusted server contexts: Route Handlers, webhook
 *   handlers, and scheduled/background jobs — and only when RLS
 *   genuinely cannot express the operation (e.g. Stripe webhooks
 *   writing subscription status for a user who isn't "logged in"
 *   on that request).
 */
export function createSupabaseServiceRoleClient(
  supabaseUrl: string,
  serviceRoleKey: string
): SupabaseClient<Database> {
  if (!serviceRoleKey) {
    throw new Error("Refusing to create a service-role Supabase client without a key.");
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

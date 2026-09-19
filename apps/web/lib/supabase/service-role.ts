import "server-only";
import { createSupabaseServiceRoleClient } from "@karaoke-queue/database";

/**
 * ⚠️ SERVICE-ROLE CLIENT — bypasses Row Level Security entirely.
 *
 * The `server-only` import above makes it a build error to import this
 * file from any Client Component. Only call this from trusted server
 * contexts that genuinely can't be expressed through RLS as the acting
 * user — e.g. Stripe webhook handlers (Phase 7).
 *
 * Not used anywhere in Phase 1. Scaffolded here so later phases have a
 * single, obviously-labeled place to reach for it.
 */
export function createServiceRoleClient() {
  return createSupabaseServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

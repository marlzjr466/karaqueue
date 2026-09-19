import { createServerClient } from "@supabase/ssr";
import type { CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@karaoke-queue/database";

/**
 * Creates a Supabase client scoped to the current request, reading/writing
 * the auth session via cookies. Use this in Server Components, Server
 * Actions, and Route Handlers. Respects RLS as the requesting user.
 *
 * Never use the service-role client (see `lib/supabase/service-role.ts`)
 * unless the operation genuinely cannot be expressed through RLS.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // Called from a Server Component without a mutable response —
        // safe to ignore because middleware refreshes the session too.
      }
    }
  };

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods }
  );
}

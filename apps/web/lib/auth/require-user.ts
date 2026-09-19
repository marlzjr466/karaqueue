import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Fetches the current user or redirects to /login.
 *
 * Middleware already blocks unauthenticated requests to protected routes,
 * but Server Components should not assume that — this is a second,
 * independent check so a protected page never renders without a user even
 * if middleware config drifts.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { user, supabase };
}

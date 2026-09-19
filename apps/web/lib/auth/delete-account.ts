import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Deletes the auth.users row for the given user id via the Supabase Admin
 * API. This cascades to `profiles` and `subscriptions` (both reference
 * auth.users with ON DELETE CASCADE) and, in later phases, to
 * queue_items/playlists as those tables are added with the same cascade.
 *
 * Service-role only — never callable from the client.
 */
export async function deleteUserAccount(userId: string) {
  const supabase = createServiceRoleClient();
  return supabase.auth.admin.deleteUser(userId);
}

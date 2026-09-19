import { requireUser } from "@/lib/auth/require-user";
import { getUserPlaylists } from "@/lib/playlists/get-playlists";
import { AppNav } from "@/components/app/app-nav";
import { PlaylistCard } from "@/components/ui/playlist-card";
import { CreatePlaylistDialog } from "@/components/playlists/create-playlist-dialog";
import { EmptyState } from "@/components/ui/empty-state";

export default async function PlaylistsPage() {
  const { user, supabase } = await requireUser();

  const [playlists, { data: entitlements }] = await Promise.all([
    getUserPlaylists(supabase, user.id),
    supabase.from("user_entitlements").select("*").eq("user_id", user.id).single()
  ]);

  // `max_playlists` is legitimately `null` for Premium (unlimited) — see
  // the same fix and explanation in app/subscription/page.tsx. Using
  // `entitlements?.max_playlists ?? 2` here would collapse Premium's
  // `null` down to 2, which wouldn't just mis-display the count — it
  // would incorrectly disable the "Create Playlist" button for Premium
  // users after their 2nd playlist.
  const limit = entitlements ? entitlements.max_playlists : 2;
  const isUnlimited = limit === null;
  const atLimit = !isUnlimited && playlists.length >= limit;

  return (
    <main className="min-h-screen bg-stage-gradient text-white">
      <AppNav active="playlists" />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your playlists</h1>
            <p className="mt-1 text-sm text-white/50">
              {isUnlimited
                ? `${playlists.length} playlists · Unlimited`
                : `${playlists.length} / ${limit} playlists`}
            </p>
          </div>
          <CreatePlaylistDialog disabled={atLimit} />
        </div>

        {playlists.length === 0 ? (
          <EmptyState
            icon="🎶"
            title="No playlists yet."
            description="Create your first karaoke playlist."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

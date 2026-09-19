import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { getUserQueue } from "@/lib/queue/get-queue";
import { getUserPlaylists } from "@/lib/playlists/get-playlists";
import { AppNav } from "@/components/app/app-nav";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const { user, supabase } = await requireUser();

  const [{ data: profile }, { data: entitlements }, queue, playlists] = await Promise.all(
    [
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("user_entitlements").select("*").eq("user_id", user.id).single(),
      getUserQueue(supabase, user.id),
      getUserPlaylists(supabase, user.id)
    ]
  );

  const displayName = profile?.display_name || user.email?.split("@")[0] || "singer";
  const nowPlaying = queue.find((i) => i.status === "playing") ?? null;
  const upNext = queue.filter((i) => i.status === "queued");
  const previewNext = (nowPlaying ? upNext : upNext.slice(1)).slice(0, 3);
  const playlistLimit = entitlements?.max_playlists;

  return (
    <main className="min-h-screen bg-stage-gradient text-white">
      <AppNav active="dashboard" />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold">Good to see you, {displayName} 🎤</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent>
              <p className="text-xs uppercase tracking-widest text-white/40">Plan</p>
              <p className="mt-2 text-xl font-semibold">
                {entitlements?.plan_name ?? "Free"}
              </p>
              <p className="mt-1 text-sm text-white/50">
                Queue: {queue.length} / {entitlements?.max_queue_items ?? 15} · Playlists:{" "}
                {playlists.length} / {playlistLimit ?? "∞"}
              </p>
              <Link
                href="/subscription"
                className="mt-4 inline-block text-sm text-neon-blue hover:underline"
              >
                Manage subscription →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-xs uppercase tracking-widest text-white/40">
                Now playing
              </p>
              {nowPlaying ? (
                <>
                  <p className="mt-2 truncate font-semibold text-white">
                    🎤 {nowPlaying.video.title}
                  </p>
                  <p className="truncate text-sm text-white/40">
                    {nowPlaying.video.channelTitle}
                  </p>
                </>
              ) : upNext.length > 0 ? (
                <p className="mt-2 text-white/60">
                  Nothing playing yet.
                  <br />
                  Head to your queue and press play.
                </p>
              ) : (
                <p className="mt-2 text-white/60">
                  Your queue is empty 🎤
                  <br />
                  Search for a song to get started.
                </p>
              )}
              {previewNext.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-white/50">
                  {previewNext.map((item) => (
                    <li key={item.id} className="truncate">
                      {item.video.title}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/queue"
                className="mt-4 inline-block text-sm text-neon-blue hover:underline"
              >
                {queue.length > 0 ? "Open player →" : "Find a song →"}
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <CardContent>
              <p className="text-xs uppercase tracking-widest text-white/40">Playlists</p>
              {playlists.length === 0 ? (
                <p className="mt-2 text-white/60">No playlists yet.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-white/70">
                  {playlists.slice(0, 3).map((p) => (
                    <li key={p.id} className="truncate">
                      {p.name} · {p.songCount} songs
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/playlists"
                className="mt-4 inline-block text-sm text-neon-blue hover:underline"
              >
                {playlists.length > 0 ? "View playlists →" : "Create a playlist →"}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

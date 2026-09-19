import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getPlaylistDetail } from "@/lib/playlists/get-playlists";
import { AppNav } from "@/components/app/app-nav";
import { PlaylistItemsList } from "@/components/playlists/playlist-items-list";
import { RenamePlaylistDialog } from "@/components/playlists/rename-playlist-dialog";
import { DeletePlaylistDialog } from "@/components/playlists/delete-playlist-dialog";
import { LoadPlaylistDialog } from "@/components/playlists/load-playlist-dialog";

export default async function PlaylistDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, supabase } = await requireUser();

  const playlist = await getPlaylistDetail(supabase, user.id, id);
  if (!playlist) notFound();

  return (
    <main className="min-h-screen bg-stage-gradient text-white">
      <AppNav active="playlists" />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold">{playlist.name}</h1>
              <RenamePlaylistDialog
                playlistId={playlist.id}
                currentName={playlist.name}
              />
            </div>
            <p className="mt-1 text-sm text-white/50">
              {playlist.items.length} {playlist.items.length === 1 ? "song" : "songs"}
            </p>
          </div>
          <DeletePlaylistDialog playlistId={playlist.id} playlistName={playlist.name} />
        </div>

        <div className="mb-6">
          <LoadPlaylistDialog
            playlistId={playlist.id}
            disabled={playlist.items.length === 0}
          />
        </div>

        <PlaylistItemsList playlistId={playlist.id} initialItems={playlist.items} />
      </div>
    </main>
  );
}

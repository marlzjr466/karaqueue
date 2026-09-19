"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, ListMusic } from "lucide-react";
import type { YouTubeVideo } from "@karaoke-queue/shared";
import type { PlaylistSummary } from "@/lib/playlists/get-playlists";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UpgradeDialog } from "@/components/app/upgrade-dialog";
import {
  listPlaylistsAction,
  createPlaylistAction,
  addToPlaylistAction
} from "@/app/actions/playlists";

export function AddToPlaylistDialog({
  video,
  open,
  onOpenChange
}: {
  video: YouTubeVideo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listPlaylistsAction()
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, [open]);

  async function handleAdd(playlistId: string, playlistName: string) {
    if (!video) return;
    setAddingId(playlistId);

    const result = await addToPlaylistAction({
      playlistId,
      youtubeId: video.youtubeId,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      durationSeconds: video.durationSeconds,
      publishedAt: video.publishedAt
    });
    setAddingId(null);

    if (!result.success) {
      if (result.code === "SONG_ALREADY_IN_PLAYLIST") {
        toast(`Already in "${playlistName}".`);
      } else {
        toast.error(result.message ?? "Could not add this song.");
      }
      return;
    }

    toast.success(`Added to "${playlistName}".`);
    onOpenChange(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const result = await createPlaylistAction({ name: newName });
    setCreating(false);

    if (!result.success) {
      if (result.code === "PLAYLIST_LIMIT_REACHED") {
        setUpgradeOpen(true);
      } else {
        toast.error(result.message ?? "Could not create playlist.");
      }
      return;
    }

    setNewName("");
    if (result.playlistId) {
      await handleAdd(result.playlistId, newName);
    }
    const updated = await listPlaylistsAction();
    setPlaylists(updated);
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title="Add to playlist"
        description={video?.title}
      >
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {loading && <p className="text-sm text-white/40">Loading your playlists…</p>}

          {!loading && playlists.length === 0 && (
            <p className="text-sm text-white/40">No playlists yet — create one below.</p>
          )}

          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              type="button"
              onClick={() => handleAdd(playlist.id, playlist.name)}
              disabled={addingId === playlist.id}
              className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-white/30 disabled:opacity-50"
            >
              <ListMusic className="h-4 w-4 flex-shrink-0 text-neon-blue" />
              <span className="min-w-0 flex-1 truncate text-sm text-white">
                {playlist.name}
              </span>
              <span className="flex-shrink-0 text-xs text-white/40">
                {addingId === playlist.id ? "Adding…" : `${playlist.songCount} songs`}
              </span>
            </button>
          ))}
        </div>

        <form
          onSubmit={handleCreate}
          className="mt-4 flex gap-2 border-t border-white/10 pt-4"
        >
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New playlist name"
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={creating || !newName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </Dialog>

      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        title="You've reached your free playlist limit"
        description="Free accounts can create up to 2 playlists. Upgrade to Premium for unlimited playlists."
      />
    </>
  );
}

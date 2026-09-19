"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { UpgradeDialog } from "@/components/app/upgrade-dialog";
import { createPlaylistAction } from "@/app/actions/playlists";

export function CreatePlaylistDialog({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createPlaylistAction({ name });
      if (!result.success) {
        if (result.code === "PLAYLIST_LIMIT_REACHED") {
          setOpen(false);
          setUpgradeOpen(true);
        } else {
          toast.error(result.message ?? "Could not create playlist.");
        }
        return;
      }

      setOpen(false);
      setName("");
      toast.success(`Created "${name}".`);
      if (result.playlistId) {
        router.push(`/playlists/${result.playlistId}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={disabled}>
        <Plus className="h-4 w-4" />
        Create Playlist
      </Button>

      <Dialog open={open} onOpenChange={setOpen} title="Create a playlist">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playlist-name" className="mb-1 block text-sm text-white/70">
              Name
            </label>
            <Input
              id="playlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Birthday Karaoke"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending || !name.trim()}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </div>
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

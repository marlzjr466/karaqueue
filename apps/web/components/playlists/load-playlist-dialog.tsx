"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { loadPlaylistIntoQueueAction } from "@/app/actions/playlists";

export function LoadPlaylistDialog({
  playlistId,
  disabled
}: {
  playlistId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleLoad(mode: "replace" | "append") {
    startTransition(async () => {
      const result = await loadPlaylistIntoQueueAction(playlistId, mode);
      if (!result.success) {
        toast.error(result.message ?? "Your playlist could not be loaded.");
        return;
      }

      setOpen(false);
      if (result.skippedCount > 0) {
        toast(
          `Added ${result.addedCount} songs — ${result.skippedCount} didn't fit in your queue.`
        );
      } else {
        toast.success(`Added ${result.addedCount} songs to your queue.`);
      }
      router.push("/queue");
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={disabled}>
        <ListPlus className="h-4 w-4" />
        Load into Queue
      </Button>

      <Dialog open={open} onOpenChange={setOpen} title="Load Playlist">
        <p className="text-sm text-white/60">
          Replace your current queue, or add these songs to the end of it?
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={() => handleLoad("replace")}
            disabled={pending}
          >
            Replace current queue
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleLoad("append")}
            disabled={pending}
          >
            Add to current queue
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </Dialog>
    </>
  );
}

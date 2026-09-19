"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { deletePlaylistAction } from "@/app/actions/playlists";

export function DeletePlaylistDialog({
  playlistId,
  playlistName
}: {
  playlistId: string;
  playlistName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deletePlaylistAction(playlistId);
      if (!result.success) {
        toast.error(result.message ?? "Could not delete playlist.");
        return;
      }
      router.push("/playlists");
    });
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete "${playlistName}"?`}
        description="This removes the playlist and its song order. This can't be undone."
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirm} disabled={pending}>
            {pending ? "Deleting…" : "Delete playlist"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

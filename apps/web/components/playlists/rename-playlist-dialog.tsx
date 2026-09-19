"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { renamePlaylistAction } from "@/app/actions/playlists";

export function RenamePlaylistDialog({
  playlistId,
  currentName
}: {
  playlistId: string;
  currentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await renamePlaylistAction(playlistId, name);
      if (!result.success) {
        toast.error(result.message ?? "Could not rename playlist.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Rename playlist"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen} title="Rename playlist">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
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
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

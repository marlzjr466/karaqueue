"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { clearQueueAction } from "@/app/actions/queue";

export function ClearQueueButton({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const result = await clearQueueAction();
      if (!result.success) {
        toast.error(result.message ?? "Could not clear your queue.");
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        Clear queue
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Clear your queue?"
        description="This removes every song from your queue. This can't be undone."
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirm} disabled={pending}>
            {pending ? "Clearing…" : "Clear queue"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

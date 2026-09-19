"use client";

import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function UpgradeDialog({
  open,
  onOpenChange,
  title,
  description
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
          Maybe later
        </Button>
        <Link href="/subscription">
          <Button size="sm">Upgrade</Button>
        </Link>
      </div>
    </Dialog>
  );
}

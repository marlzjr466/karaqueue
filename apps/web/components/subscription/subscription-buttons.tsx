"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createCheckoutSessionAction,
  createBillingPortalSessionAction
} from "@/app/actions/subscription";

export function UpgradeButton() {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createCheckoutSessionAction();
      // A successful call redirects and never returns here — reaching
      // this line means it failed.
      if (!result.success) {
        toast.error(result.message ?? "Could not start checkout.");
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      {pending ? "Starting checkout…" : "Upgrade to Premium"}
    </Button>
  );
}

export function ManageBillingButton() {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createBillingPortalSessionAction();
      if (!result.success) {
        toast.error(result.message ?? "Could not open billing portal.");
      }
    });
  }

  return (
    <Button variant="secondary" onClick={handleClick} disabled={pending}>
      {pending ? "Opening…" : "Manage billing"}
    </Button>
  );
}

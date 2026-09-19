"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function CheckoutResultToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("Welcome to Premium! Your queue and playlist limits are updated.");
      router.replace("/subscription");
    } else if (checkout === "canceled") {
      toast("Checkout canceled — no changes were made.");
      router.replace("/subscription");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

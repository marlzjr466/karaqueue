"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns `true` while the user is "active" (has moved the mouse or
 * tapped within the last `timeoutMs`), and `false` once they've been
 * idle — used to auto-hide floating fullscreen controls without
 * permanently covering the video. Only active when `enabled` is true.
 */
export function useIdleVisibility(enabled: boolean, timeoutMs = 3000) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setVisible(true);
      return;
    }

    function show() {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), timeoutMs);
    }

    show();
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);
    window.addEventListener("keydown", show);

    return () => {
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      window.removeEventListener("keydown", show);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, timeoutMs]);

  return visible;
}

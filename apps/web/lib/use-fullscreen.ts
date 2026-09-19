"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Requests fullscreen on `document.documentElement` rather than a
 * specific sub-element. This lets the karaoke player, its overlay
 * controls, and the DOM node hosting the YouTube iframe all stay exactly
 * where they already are in the tree — entering/exiting fullscreen only
 * toggles CSS (see PlayerView's `immersive` prop), so the player is never
 * unmounted or recreated.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enter = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen API unsupported/denied — fall back to CSS-only
      // immersive mode by setting state directly.
      setIsFullscreen(true);
    }
  }, []);

  const exit = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        setIsFullscreen(false);
      }
    } else {
      setIsFullscreen(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) void exit();
    else void enter();
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}

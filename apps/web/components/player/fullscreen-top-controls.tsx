"use client";

import { Square, SkipForward, Minimize } from "lucide-react";
import { useIdleVisibility } from "@/lib/use-idle-visibility";
import { Button } from "@/components/ui/button";

export function FullscreenTopControls({
  hasNowPlaying,
  hasNext,
  advancing,
  onStop,
  onNext,
  onExit
}: {
  hasNowPlaying: boolean;
  hasNext: boolean;
  advancing: boolean;
  onStop: () => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const visible = useIdleVisibility(true, 3000);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-top-controls flex justify-end p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(10,10,20,0.65)] px-3 py-2 backdrop-blur-md">
        <Button
          variant="secondary"
          size="sm"
          onClick={onStop}
          disabled={!hasNowPlaying}
          aria-label="Stop"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onNext}
          disabled={!hasNowPlaying || !hasNext || advancing}
          aria-label="Next"
          title={!hasNext ? "No more songs in queue" : "Next"}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onExit}
          aria-label="Exit fullscreen"
        >
          <Minimize className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

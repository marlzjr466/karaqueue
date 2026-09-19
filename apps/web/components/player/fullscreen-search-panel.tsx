"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import type { YouTubeVideo } from "@karaoke-queue/shared";
import { SearchPanel } from "@/components/search/search-panel";

export function FullscreenSearchPanel({
  queueCount,
  queueLimit,
  onAddToQueue
}: {
  queueCount: number;
  queueLimit: number;
  onAddToQueue: (
    video: YouTubeVideo
  ) => Promise<{ success: boolean; limitReached?: boolean }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 top-20 z-search">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open search"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[rgba(10,10,20,0.65)] text-white backdrop-blur-md transition hover:border-white/30"
        >
          <Search className="h-5 w-5" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex h-[min(70vh,640px)] w-[340px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[rgba(10,10,20,0.65)] backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-white">Search</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SearchPanel
                queueCount={queueCount}
                queueLimit={queueLimit}
                onAddToQueue={onAddToQueue}
                bare
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

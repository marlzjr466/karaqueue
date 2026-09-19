"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Equalizer } from "./equalizer";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pt-28">
      {/* Ambient stage glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-neon-magenta/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 right-1/4 h-72 w-72 rounded-full bg-neon-blue/20 blur-[100px]"
      />

      <motion.div
        className="relative mx-auto max-w-4xl text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-neon-blue">
          <Equalizer className="h-3" />
          The digital karaoke machine
        </p>

        <h1 className="text-balance bg-gradient-to-r from-neon-magenta via-neon-purple to-neon-blue bg-clip-text text-5xl font-bold leading-tight text-transparent sm:text-7xl">
          Your songs.
          <br />
          Your queue.
          <br />
          Your stage.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
          Search YouTube karaoke videos, build your queue, and let the music play all
          night.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register">
            <Button variant="primary" size="lg">
              Start Singing
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Mock player + queue preview */}
      <motion.div
        className="relative mx-auto mt-16 max-w-2xl"
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:p-6">
          <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-stage-800 to-stage-950">
            <button
              type="button"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-neon-magenta transition hover:brightness-110"
              aria-label="Play preview"
            >
              <Play className="ml-1 h-7 w-7 fill-white text-white" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Just The Way You Are</p>
              <p className="text-sm text-white/40">Karaoke Version</p>
            </div>
            <Equalizer />
          </div>

          <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-white/50">
            <ListMusic className="h-4 w-4" />
            Up next: Easy On Me · Perfect · Lover
          </div>
        </div>
      </motion.div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const BAR_COUNT = 5;

export function Equalizer({
  className,
  color = "bg-neon-magenta"
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={cn("flex h-6 items-end gap-1", className)} aria-hidden="true">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <motion.span
          key={i}
          className={cn("w-1 rounded-full", color)}
          animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }}
          transition={{
            duration: 1.2 + (i % 3) * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.12
          }}
        />
      ))}
    </div>
  );
}

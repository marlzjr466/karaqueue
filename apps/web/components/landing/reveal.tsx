"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/cn";

const variants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }
  }
};

export function Reveal({
  children,
  className,
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/** Parent wrapper that staggers its Reveal-style children in as a group. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } }
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={cn(className)} variants={variants}>
      {children}
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const spring = { type: "spring", stiffness: 380, damping: 30 } as const;

export function Stagger({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 18, scale: 0.985 },
        show: { opacity: 1, y: 0, scale: 1, transition: spring },
      }}
    >
      {children}
    </motion.div>
  );
}
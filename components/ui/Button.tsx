"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "glass" | "ghost";
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}

const STYLES = {
  primary:
    "bg-gradient-to-b from-[#E8697B] to-[#D94F63] text-white shadow-[0_12px_30px_-12px_rgba(217,79,99,0.65)] hover:shadow-[0_16px_38px_-12px_rgba(217,79,99,0.85)] hover:brightness-[1.05]",
  glass: "glass text-[var(--color-ink)] hover:bg-white/35",
  ghost: "text-[var(--color-ink-soft)] hover:bg-white/25 hover:text-[var(--color-ink)]",
} as const;

export default function Button({ children, variant = "primary", icon, className = "", onClick, type = "button" }: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-[box-shadow,background-color,filter] duration-300 ${STYLES[variant]} ${className}`}
    >
      {icon}
      {children}
    </motion.button>
  );
}
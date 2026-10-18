"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className={compact ? "block h-9 w-9" : "block h-10 w-10"} />;

  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={`glass flex shrink-0 items-center justify-center rounded-xl text-[var(--color-ink-soft)] transition hover:bg-white/40 hover:text-[var(--color-ink)] ${
        compact ? "h-9 w-9" : "h-10 w-10"
      }`}
    >
      <Icon size={compact ? 15 : 17} />
    </button>
  );
}
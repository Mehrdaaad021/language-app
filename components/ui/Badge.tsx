import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  tone?: "success" | "danger" | "warn" | "info";
}

const TONES = {
  success: "bg-[rgba(122,178,146,0.20)] text-[#2F6B4F] border-[rgba(47,107,79,0.28)]",
  danger: "bg-[rgba(217,79,99,0.14)] text-[#B23A4C] border-[rgba(178,58,76,0.28)]",
  warn: "bg-[rgba(214,142,60,0.18)] text-[#8A5A22] border-[rgba(138,90,34,0.28)]",
  info: "bg-white/40 text-[var(--color-ink)] border-white/60",
} as const;

export default function Badge({ children, tone = "info" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold backdrop-blur-md ${TONES[tone]}`}>
      {children}
    </span>
  );
}
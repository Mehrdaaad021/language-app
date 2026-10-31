import type { LucideIcon } from "lucide-react";

type Variant = "pink" | "amber" | "cream" | "rose";

const VARIANTS: Record<Variant, { bg: string; icon: string; glow: string }> = {
  pink: {
    bg: "from-[#fde7ec] to-[#f8d8e0]",
    icon: "bg-[#d94f63]/10 text-[#c2586b]",
    glow: "bg-[#d94f63]/25",
  },
  amber: {
    bg: "from-[#fbf0d9] to-[#f6e7c6]",
    icon: "bg-[#d98a2b]/10 text-[#b3701f]",
    glow: "bg-[#e9a23b]/25",
  },
  cream: {
    bg: "from-[#fefcf7] to-[#fdfbf5]",
    icon: "bg-[#4a2430]/8 text-[#4a2430]",
    glow: "bg-[#96707b]/20",
  },
  rose: {
    bg: "from-[#fbe3e1] to-[#f6d2ce]",
    icon: "bg-[#b3261e]/10 text-[#b3261e]",
    glow: "bg-[#b3261e]/20",
  },
};

export default function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: LucideIcon;
  variant: Variant;
}) {
  const v = VARIANTS[variant];

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${v.bg} p-5 shadow-[0_10px_30px_-18px_rgba(74,36,48,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_-20px_rgba(74,36,48,0.45)]`}
    >
      {/* هاله‌ی نور تزئینی */}
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${v.glow} blur-2xl transition-transform duration-500 group-hover:scale-150`}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-extrabold text-[#7c5a63]">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#40222c]">
            {value}
            {suffix && <span className="ms-1 text-xs font-bold text-[#7c5a63]">{suffix}</span>}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${v.icon} transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
        >
          <Icon size={22} strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}
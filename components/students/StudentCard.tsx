"use client";

import { useLocale } from "next-intl";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Link } from "@/i18n/navigation";
import { toFa } from "@/lib/jalali";

const AVATAR_GRADIENTS = [
  "from-[#e8697b] to-[#d94f63]",
  "from-[#e9a23b] to-[#d98a2b]",
  "from-[#7c5a63] to-[#4a2430]",
  "from-[#c2586b] to-[#96707b]",
];

type Student = {
  id: string;
  name: string;
  level: string;
  term: string;
  active: boolean;
  phone?: string;
  email?: string;
};

export default function StudentCard({ student }: { student: Student }) {
  const locale = useLocale();
  const fa = locale === "fa";
  const toast = useToast();

  const gradient = AVATAR_GRADIENTS[student.name.charCodeAt(0) % AVATAR_GRADIENTS.length];

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(fa ? `✅ ${label} کپی شد` : `✅ ${label} copied`);
    } catch {
      toast(fa ? "❌ کپی ناموفق" : "❌ Copy failed");
    }
  };

  return (
    <div className="group relative flex h-full flex-col rounded-3xl bg-[var(--c-surface)] p-5 shadow-[0_10px_30px_-18px_rgba(74,36,48,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_-20px_rgba(74,36,48,0.45)]">
      {/* لینک کشیده‌شده روی کل کارت */}
      <Link
        href={`/students/${student.id}`}
        className="absolute inset-0 z-0 rounded-3xl"
        aria-label={student.name}
      />

      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-lg font-extrabold text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
        >
          {student.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold">{student.name}</p>
          <p className="mt-0.5 text-xs text-[var(--c-ink-soft)]">
            {student.level} — {fa ? "ترم" : "Term"}: {student.term}
          </p>
        </div>
        <Badge tone={student.active ? "success" : "info"}>
          {student.active ? (fa ? "فعال" : "Active") : (fa ? "غیرفعال" : "Inactive")}
        </Badge>
      </div>

      {(student.phone || student.email) && (
        <div className="relative mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--c-ink-soft)]">
          {student.phone && (
            <span className="tabular-nums">{fa ? toFa(student.phone) : student.phone}</span>
          )}
          {student.email && <span className="truncate">{student.email}</span>}
        </div>
      )}

      {/* quick actions — فقط در hover */}
      <div className="absolute left-4 top-4 z-10 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {student.phone && (
          <button
            type="button"
            onClick={() => copy(student.phone!, fa ? "شماره" : "Phone")}
            aria-label={fa ? "کپی شماره" : "Copy phone"}
            className="rounded-lg bg-white/90 p-1.5 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <Phone size={14} />
          </button>
        )}
        {student.email && (
          <button
            type="button"
            onClick={() => copy(student.email!, fa ? "ایمیل" : "Email")}
            aria-label={fa ? "کپی ایمیل" : "Copy email"}
            className="rounded-lg bg-white/90 p-1.5 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <Mail size={14} />
          </button>
        )}
      </div>

      <ArrowUpRight
        size={16}
        className="absolute bottom-4 left-4 z-10 text-[var(--c-ink-soft)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
    </div>
  );
}
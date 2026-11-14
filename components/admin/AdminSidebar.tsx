"use client";
import { Palette } from "lucide-react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Users,
  School,
  HelpCircle,
  Shield,
  BookOpen,
  TrendingUp,
} from "lucide-react";

const items = [
  { href: "/admin", icon: LayoutDashboard, fa: "داشبورد", en: "Dashboard" },
  { href: "/admin/teachers", icon: School, fa: "معلم‌ها", en: "Teachers" },
  { href: "/admin/users", icon: Users, fa: "کاربران", en: "Users" },
  { href: "/admin/growth", icon: TrendingUp, fa: "رشد", en: "Growth" },
  { href: "/admin/tickets", icon: HelpCircle, fa: "تیکت‌ها", en: "Tickets" },
  { href: "/admin/landing", icon: Palette, fa: "لندینگ", en: "Landing" },
  { href: "/dashboard", icon: BookOpen, fa: "بازگشت به پنل", en: "Back to app" },
];

export default function AdminSidebar({ locale }: { locale: string }) {
  const fa = locale === "fa";
  const pathname = usePathname();
  const isActive = (h: string) => h === "/admin" ? pathname === "/admin" : pathname.startsWith(h);

  return (
    <aside className="hidden w-72 shrink-0 border-e border-[var(--c-primary)]/10 bg-[var(--c-surface)] p-4 md:block">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4a2430] to-[#2a141a] text-white shadow-lg">
          <Shield size={18} />
        </div>
        <div>
          <p className="text-sm font-extrabold">{fa ? "پنل ادمین" : "Admin Panel"}</p>
          <p className="text-[10px] text-[var(--c-ink-soft)]">{fa ? "مدیریت پلتفرم" : "Platform control"}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive(item.href)
                  ? "bg-[var(--c-primary)] text-white"
                  : "text-[var(--c-ink-soft)] hover:bg-[var(--c-surface-2)] hover:text-[var(--c-ink)]"
              }`}
            >
              <Icon size={16} />
              {fa ? item.fa : item.en}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
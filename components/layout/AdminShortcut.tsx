"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShieldCheck } from "lucide-react";
import { amIAdmin } from "@/lib/server/admin-actions";

export default function AdminShortcut() {
  const locale = useLocale();
  const fa = locale === "fa";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    amIAdmin()
      .then((v) => {
        if (alive) setVisible(v);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/admin"
      prefetch
      className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#4a2430] to-[#2a141a] px-4 py-3 text-sm font-extrabold text-[#f6eede] shadow-lg transition hover:scale-[1.02]"
    >
      <ShieldCheck size={18} className="text-[#f2a9bc]" />
      {fa ? "🛡️ پنل ادمین" : "🛡️ Admin panel"}
    </Link>
  );
}
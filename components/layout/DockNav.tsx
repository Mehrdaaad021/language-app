"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  Home,
  Users,
  Wallet,
  Settings,
  Plus,
  type LucideIcon,
} from "lucide-react";

const DOCK_CLIP =
  "path('M 0 26 Q 0 0 26 0 L 138 0 C 150 0 153 7 156 14 A 26 26 0 0 0 204 14 C 207 7 210 0 222 0 L 334 0 Q 360 0 360 26 L 360 52 Q 360 78 334 78 L 26 78 Q 0 78 0 52 Z')";

const spring = { type: "spring", stiffness: 420, damping: 32 } as const;

type DockItem = { key: string; href: string; icon: LucideIcon };

const LEFT_ITEMS: DockItem[] = [
  { key: "settings", href: "/settings", icon: Settings },
  { key: "payments", href: "/payments", icon: Wallet },
];

const RIGHT_ITEMS: DockItem[] = [
  { key: "students", href: "/students", icon: Users },
  { key: "dashboard", href: "/dashboard", icon: Home },
];

export default function DockNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  const tn = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const activeKey = [...LEFT_ITEMS, ...RIGHT_ITEMS].find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`)
  )?.key;

  const renderItem = (item: DockItem) => {
    const active = activeKey === item.key;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => router.push(item.href)}
        aria-label={tn(item.key)}
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl transition-colors"
      >
        {active && (
          <motion.span
            layoutId="dock-active"
            className="absolute inset-0 rounded-2xl bg-white/10"
            transition={spring}
          />
        )}
        <item.icon
          size={20}
          className={`relative z-10 transition-colors ${
            active ? "text-white" : "text-white/55 hover:text-white/85"
          }`}
        />
      </button>
    );
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center pb-4 md:hidden">
      {/* برچسب گزینه‌ی فعال */}
      <AnimatePresence mode="wait">
        {activeKey && (
          <motion.p
            key={activeKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mb-2 text-[11px] font-extrabold text-white/80"
          >
            {tn(activeKey)}
          </motion.p>
        )}
      </AnimatePresence>

      {/* بدنه‌ی داک با بریدگی منحنی */}
      <motion.div
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
        className="pointer-events-auto relative w-[360px] max-w-[calc(100vw-2rem)] max-[380px]:scale-90"
        style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.45))" }}
      >
        <div
          className="relative flex h-[78px] items-center justify-between px-4 backdrop-blur-2xl"
          style={{
            clipPath: DOCK_CLIP,
            background:
              "linear-gradient(180deg, rgba(28,22,26,0.86) 0%, rgba(18,14,17,0.92) 100%)",
          }}
        >
          <div className="flex items-center gap-1">
            {LEFT_ITEMS.map(renderItem)}
          </div>
          <div className="w-16" /> {/* فضای گوی مرکزی */}
          <div className="flex items-center gap-1">
            {RIGHT_ITEMS.map(renderItem)}
          </div>
        </div>

        {/* گوی مرکزی */}
        <motion.button
          type="button"
          aria-label="quick add"
          onClick={onQuickAdd}
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.05 }}
          onTapStart={() => setPressed(true)}
          onDragEnd={() => setPressed(false)}
          className="absolute left-1/2 top-[-26px] z-20 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#F08A8A] to-[#D94F63] text-white"
          style={{
            boxShadow:
              "0 0 0 3px rgba(255,255,255,0.9), 0 0 0 7px rgba(20,14,17,0.9), 0 14px 34px -8px rgba(217,79,99,0.75)",
          }}
        >
          <motion.span
            animate={{ rotate: pressed ? 45 : 0 }}
            transition={spring}
            className="flex items-center justify-center"
          >
            <Plus size={26} strokeWidth={2.5} />
          </motion.span>
        </motion.button>
      </motion.div>
    </div>
  );
}
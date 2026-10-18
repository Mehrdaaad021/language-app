"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";

export default function StudentHome({ name }: { name: string }) {
  const t = useTranslations("Auth");

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div className="glass-bg">
        <div className="blob-3" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="glass-strong w-full max-w-md rounded-[28px] p-8 text-center"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white shadow-[0_12px_30px_-12px_rgba(217,79,99,0.7)]">
          <GraduationCap size={24} />
        </span>
        <h1 className="mt-4 text-xl font-extrabold">{t("studentPortalTitle")}</h1>
        <p className="mt-2 text-sm font-bold text-[var(--color-ink-soft)]">{name}</p>
        <p className="mt-4 text-sm leading-7 text-[var(--color-ink-soft)]">{t("studentPortalBody")}</p>
        <div className="mt-6 flex justify-center">
          <LogoutButton />
        </div>
      </motion.div>
    </main>
  );
}
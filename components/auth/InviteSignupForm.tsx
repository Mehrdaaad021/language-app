"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link2, UserPlus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { setupTeacher } from "@/lib/server/auth-actions";
import { claimInvite } from "@/lib/server/invite-actions";
import type { Awaited<ReturnType<typeof import("@/lib/server/invite-actions").getInviteInfo>>;

export default function InviteSignupForm({
  info,
  token,
  locale,
  firstRun,
}: {
  info: NonNullable<Awaited<ReturnType<typeof import("@/lib/server/invite-actions").getInviteInfo>>>;
  token: string;
  locale: string;
  firstRun: boolean;
}) {
  const t = useTranslations("Invite");
  const router = useRouter();
  const [name, setName] = useState(info.studentName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // ابتدا حساب کاربری بساز (به عنوان STUDENT)
    // برای ساده‌سازی: از setupTeacher استفاده می‌کنیم ولی role رو override می‌کنیم
    // راه بهتر: یک action جدید بسازیم. فعلاً از loginAction بعد از signup استفاده می‌کنیم.
    const setupRes = await setupTeacher({ name: info.studentName, email, password });
    if (!setupRes.ok) {
      setError(setupRes.error);
      setLoading(false);
      return;
    }

    // حالا claim می‌کنیم
    const claimRes = await claimInvite({ token, password });
    if (!claimRes.ok) {
      setError(claimRes.error);
      setLoading(false);
      return;
    }

    router.replace("/student");
    router.refresh();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div className="glass-bg">
        <div className="blob-3" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="glass-strong w-full max-w-md rounded-[28px] p-8"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFE8C4] to-[#FFF4DE] text-[#8A5A22] shadow-inner">
            <UserPlus size={24} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold">{t("welcome")}</h1>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{info.studentName} — {info.level}</p>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-xl bg-white/25 px-4 py-3 text-xs font-bold text-[var(--color-ink-soft)]">
          <Link2 size={14} />
          {t("invitedByTeacher")}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <TextField label={t("email")} type="email" placeholder="you@class.ir" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label={t("password")} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="-mt-2 text-[11px] font-medium text-[var(--color-ink-soft)]">{t("passwordHint")}</p>

          {error && (
            <p className="rounded-xl bg-[rgba(217,79,99,0.12)] px-4 py-2.5 text-xs font-bold text-[#B23A4C]">
              {t(`errors.${error}`)}
            </p>
          )}

          <Button type="submit" className="mt-1 justify-center">
            {loading ? t("loading") : t("claimAccount")}
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link2, Check } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { claimInvite, type InviteInfo } from "@/lib/server/invite-actions";

export default function InviteClaimForm({
  info,
  token,
}: {
  info: InviteInfo;
  token: string;
  locale?: string;
}) {
  const t = useTranslations("Invite");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await claimInvite({ token, password });
    if (!res.ok) {
      setError(res.error);
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
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A6D8BA] to-[#7BB894] text-white shadow-[0_12px_30px_-12px_rgba(122,178,146,0.7)]">
            <Check size={24} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold">{t("claimTitle")}</h1>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{info.studentName}</p>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-xl bg-white/25 px-4 py-3 text-xs font-bold text-[var(--color-ink-soft)]">
          <Link2 size={14} />
          {t("confirmPassword")}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <TextField label={t("password")} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="-mt-2 text-[11px] font-medium text-[var(--color-ink-soft)]">{t("claimHint")}</p>

          {error && (
            <p className="rounded-xl bg-[rgba(217,79,99,0.12)] px-4 py-2.5 text-xs font-bold text-[#B23A4C]">
              {t(`errors.${error}`)}
            </p>
          )}

          <Button type="submit" className="mt-1 justify-center">
            {loading ? t("loading") : t("goToPortal")}
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
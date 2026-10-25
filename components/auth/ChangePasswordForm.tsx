"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { changePassword } from "@/lib/server/auth-actions";

export default function ChangePasswordForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("passwordsDontMatch");
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (!res.ok) {
        setError(res.error);
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("serverError");
      setLoading(false);
    }
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
            <Lock size={24} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold">{t("changePasswordTitle")}</h1>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{t("changePasswordSubtitle")}</p>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <TextField
            label={t("oldPassword")}
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <TextField
            label={t("newPassword")}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            label={t("confirmPassword")}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && (
            <p className="rounded-xl bg-[rgba(217,79,99,0.12)] px-4 py-2.5 text-xs font-bold text-[#B23A4C]">
              {t(`errors.${error}`)}
            </p>
          )}

          <Button type="submit" className="mt-1 justify-center">
            {loading ? t("loading") : t("changePassword")}
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
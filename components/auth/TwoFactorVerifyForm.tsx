"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { logoutAction } from "@/lib/server/auth-actions";
import { verifyTwoFactorLogin } from "@/lib/server/two-factor-actions";

export default function TwoFactorVerifyForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await verifyTwoFactorLogin(code);
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  };

  const cancel = async () => {
    await logoutAction();
    router.replace("/login");
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
            <ShieldCheck size={24} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold">{t("twoFactorTitle")}</h1>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{t("twoFactorSubtitle")}</p>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <TextField
            label={t("twoFactorCode")}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <p className="-mt-2 text-[11px] font-medium text-[var(--color-ink-soft)]">{t("twoFactorHint")}</p>

          {error && (
            <p className="rounded-xl bg-[rgba(217,79,99,0.12)] px-4 py-2.5 text-xs font-bold text-[#B23A4C]">
              {t(`errors.${error}`)}
            </p>
          )}

          <div className="mt-1 flex flex-col gap-2">
            <Button type="submit" className="justify-center">
              {loading ? t("loading") : t("verifyCode")}
            </Button>
            <Button variant="ghost" type="button" onClick={cancel} className="justify-center">
              {t("cancelLogin")}
            </Button>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
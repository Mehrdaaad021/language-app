"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { loginAction } from "@/lib/server/auth-actions";

export default function LoginForm({ showSetup }: { showSetup: boolean }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await loginAction({ email, password });
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    if (res.requires2fa) {
      router.replace("/login/verify-2fa");
      router.refresh();
      return;
    }
    router.replace(res.role === "TEACHER" ? "/dashboard" : "/student");
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="glass-strong w-full max-w-md rounded-[28px] p-8"
    >
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white shadow-[0_12px_30px_-12px_rgba(217,79,99,0.7)]">
          <BookOpen size={24} />
        </span>
        <div>
          <h1 className="text-xl font-extrabold">{t("loginTitle")}</h1>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{t("loginSubtitle")}</p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={t("email")} type="email" placeholder="you@class.ir" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label={t("password")} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && (
          <p className="rounded-xl bg-[rgba(217,79,99,0.12)] px-4 py-2.5 text-xs font-bold text-[#B23A4C]">
            {t(`errors.${error}`)}
          </p>
        )}

        <Button type="submit" className="mt-1 justify-center">
          {loading ? t("loading") : t("submitLogin")}
        </Button>
      </form>

      {showSetup && (
        <p className="mt-5 text-center text-xs font-bold text-[var(--color-ink-soft)]">
          <Link href="/setup" className="text-[var(--color-primary)] transition hover:text-[#B23A4C]">
            {t("goSetup")}
          </Link>
        </p>
      )}
    </motion.div>
  );
}
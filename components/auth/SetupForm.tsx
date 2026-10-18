"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { setupTeacher } from "@/lib/server/auth-actions";

export default function SetupForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await setupTeacher({ name, email, password });
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    router.replace("/");
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
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFE8C4] to-[#FFF4DE] text-[#8A5A22] shadow-inner">
          <Sparkles size={24} />
        </span>
        <div>
          <h1 className="text-xl font-extrabold">{t("setupTitle")}</h1>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{t("setupSubtitle")}</p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={t("name")} placeholder="Mehrdad" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label={t("email")} type="email" placeholder="you@class.ir" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label={t("password")} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="-mt-2 text-[11px] font-medium text-[var(--color-ink-soft)]">{t("passwordHint")}</p>

        {error && (
          <p className="rounded-xl bg-[rgba(217,79,99,0.12)] px-4 py-2.5 text-xs font-bold text-[#B23A4C]">
            {t(`errors.${error}`)}
          </p>
        )}

        <Button type="submit" className="mt-1 justify-center">
          {loading ? t("loading") : t("submitSetup")}
        </Button>
      </form>
    </motion.div>
  );
}
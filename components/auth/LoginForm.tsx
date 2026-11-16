"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { BookOpen, TriangleAlert } from "lucide-react";
import { loginAction } from "@/lib/server/auth-actions";

const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/50 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

export default function LoginForm({ dbError }: { dbError: boolean }) {
  const locale = useLocale();
  const fa = locale === "fa";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await loginAction({ email, password });
    setBusy(false);
    if (res.ok) {
      window.location.assign(`/${locale}/dashboard`);
      return;
    }
    if (res.error === "2fa") {
      window.location.assign(`/${locale}/login/verify-2fa`);
      return;
    }
    const map: Record<string, string> = {
      invalid: fa ? "ایمیل یا رمز اشتباه است" : "Wrong email or password",
      locked: fa ? "تلاش بیش از حد — ۱۰ دقیقه صبر کن" : "Too many attempts — wait 10 minutes",
      suspended: fa ? "حساب معلق شده" : "Account suspended",
    };
    setErr(map[res.error ?? ""] ?? (fa ? "ورود ناموفق — دوباره تلاش کن" : "Login failed — try again"));
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card-lux w-full max-w-md space-y-4 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white shadow-lg">
            <BookOpen size={22} />
          </span>
          <h1 className="text-xl font-extrabold">{fa ? "ورود به دستیار کلاس" : "Sign in to Class Assistant"}</h1>
          <p className="text-xs text-[var(--c-ink-soft)]">{fa ? "خوش برگشتی!" : "Welcome back!"}</p>
        </div>

        {dbError && (
          <div className="flex items-start gap-2 rounded-2xl bg-[#f6e7c6] p-3 text-[11px] font-bold text-[#b3701f]">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
            {fa
              ? "اتصال به دیتابیس برقرار نشد. چند ثانیه صبر کن و دوباره تلاش کن (Neon در حال بیدار شدن است)."
              : "Database unreachable. Wait a few seconds and retry (Neon is waking up)."}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-extrabold">{fa ? "ایمیل" : "Email"}</label>
            <input className={inputCls} dir="ltr" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-extrabold">{fa ? "رمز عبور" : "Password"}</label>
            <input className={inputCls} dir="ltr" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {err && <p className="text-[11px] font-extrabold text-[#b3261e]">{err}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full rounded-full py-2.5 text-sm font-extrabold shadow-lg disabled:opacity-60">
            {busy ? "…" : fa ? "ورود" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { BookOpen, TriangleAlert } from "lucide-react";
import { setupTeacher } from "@/lib/server/auth-actions";

const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/50 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

export default function SetupForm({ dbError }: { dbError: boolean }) {
  const locale = useLocale();
  const fa = locale === "fa";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await setupTeacher(form);
    setBusy(false);
    if (res.ok) {
      window.location.assign(`/${locale}/dashboard`);
      return;
    }
    if (res.error === "alreadySetup") {
      window.location.assign(`/${locale}/login`);
      return;
    }
    setErr(
      res.error === "emailTaken"
        ? fa ? "این ایمیل قبلاً ثبت شده" : "Email already taken"
        : fa ? "ساخت حساب ناموفق بود" : "Setup failed"
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card-lux w-full max-w-md space-y-4 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white shadow-lg">
            <BookOpen size={22} />
          </span>
          <h1 className="text-xl font-extrabold">{fa ? "ساخت حساب معلم" : "Create teacher account"}</h1>
        </div>

        {dbError && (
          <div className="flex items-start gap-2 rounded-2xl bg-[#f6e7c6] p-3 text-[11px] font-bold text-[#b3701f]">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
            {fa ? "اتصال دیتابیس برقرار نشد — دوباره تلاش کن." : "Database unreachable — retry."}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input className={inputCls} placeholder={fa ? "نام" : "Name"} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={inputCls} dir="ltr" type="email" placeholder={fa ? "ایمیل" : "Email"} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputCls} dir="ltr" type="password" placeholder={fa ? "رمز (حداقل ۸)" : "Password (min 8)"} required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {err && <p className="text-[11px] font-extrabold text-[#b3261e]">{err}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full rounded-full py-2.5 text-sm font-extrabold shadow-lg disabled:opacity-60">
            {busy ? "…" : fa ? "ساخت حساب" : "Create account"}
          </button>
        </form>

        <a href={`/${locale}/login`} className="block text-center text-xs font-extrabold text-[#d94f63]">
          {fa ? "حساب داری؟ وارد شو" : "Have an account? Sign in"}
        </a>
      </div>
    </main>
  );
}
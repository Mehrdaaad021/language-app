"use client";

import { useState } from "react";
import { Check, Plus, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { setWorkspaceStatus, createTeacher } from "@/lib/server/admin-actions";

type Teacher = {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerId: string;
  verified: boolean;
  suspended: boolean;
  studentCount: number;
  sessionCount: number;
  paymentCount: number;
};

const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/40 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

export default function AdminTeachersClient({ teachers }: { teachers: Teacher[] }) {
  const toast = useToast();
  const [list, setList] = useState(teachers);

  /* ── state مودال افزودن معلم ── */
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);

  const toFa = (s: string | number) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

  /* ── تأیید / تعلیق workspace ── */
  const act = async (id: string, action: "verify" | "unverify" | "suspend" | "unsuspend") => {
    const res = await setWorkspaceStatus(id, action);
    if (res.ok) {
      setList((l) =>
        l.map((t) => {
          if (t.id !== id) return t;
          if (action === "verify") return { ...t, verified: true };
          if (action === "unverify") return { ...t, verified: false };
          if (action === "suspend") return { ...t, suspended: true };
          if (action === "unsuspend") return { ...t, suspended: false };
          return t;
        })
      );
      toast("✅ انجام شد");
    } else {
      toast("❌ خطا");
    }
  };

  /* ── ساخت معلم جدید ── */
  const doCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
      toast("❌ همه‌ی فیلدها رو کامل کن (رمز حداقل ۸ کاراکتر)");
      return;
    }
    setSaving(true);
    const res = await createTeacher(form);
    setSaving(false);
    if (res.ok) {
      toast("✅ معلم ساخته شد");
      setShowAdd(false);
      setForm({ name: "", email: "", password: "" });
      setTimeout(() => window.location.reload(), 600);
    } else {
      toast(res.error === "EMAIL_EXISTS" ? "❌ این ایمیل قبلاً ثبت شده" : "❌ خطا در ساخت معلم");
    }
  };

  return (
    <div className="space-y-4">
      {/* هدر + دکمه‌ی افزودن */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">معلم‌ها</h1>
          <p className="mt-1 text-xs text-[var(--c-ink-soft)]">
            مدیریت workspace های معلم‌ها: تأیید، تعلیق و افزودن معلم جدید
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-lg transition hover:scale-105"
        >
          <Plus size={16} />
          افزودن معلم
        </button>
      </div>

      {/* جدول معلم‌ها */}
      <div className="card-lux overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-[var(--c-surface-2)]/50 text-xs">
            <tr>
              <th className="px-4 py-3 text-start font-extrabold">نام معلم</th>
              <th className="px-4 py-3 text-start font-extrabold">ایمیل</th>
              <th className="px-4 py-3 text-center font-extrabold">شاگرد</th>
              <th className="px-4 py-3 text-center font-extrabold">جلسات</th>
              <th className="px-4 py-3 text-center font-extrabold">وضعیت</th>
              <th className="px-4 py-3 text-center font-extrabold">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--c-primary)]/10">
            {list.map((t) => (
              <tr key={t.id} className="transition hover:bg-[var(--c-surface-2)]/30">
                <td className="px-4 py-3 font-bold">{t.ownerName}</td>
                <td className="px-4 py-3 text-[var(--c-ink-soft)]" dir="ltr">
                  {t.ownerEmail}
                </td>
                <td className="px-4 py-3 text-center tabular-nums">{toFa(t.studentCount)}</td>
                <td className="px-4 py-3 text-center tabular-nums">{toFa(t.sessionCount)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    {t.verified && (
                      <span className="chip-lux bg-[#e0f0e6] text-[#2f7a55]">
                        <ShieldCheck size={10} /> تأییدشده
                      </span>
                    )}
                    {t.suspended && (
                      <span className="chip-lux bg-[#f6d2ce] text-[#b3261e]">
                        <ShieldAlert size={10} /> معلق
                      </span>
                    )}
                    {!t.verified && !t.suspended && (
                      <span className="chip-lux bg-[#f6e7c6] text-[#b3701f]">در انتظار</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    {!t.verified ? (
                      <button
                        onClick={() => act(t.id, "verify")}
                        className="rounded-lg bg-[#e0f0e6] p-1.5 text-[#2f7a55] transition hover:brightness-95"
                        title="تأیید"
                      >
                        <Check size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => act(t.id, "unverify")}
                        className="rounded-lg bg-[#f6e7c6] p-1.5 text-[#b3701f] transition hover:brightness-95"
                        title="لغو تأیید"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {!t.suspended ? (
                      <button
                        onClick={() => act(t.id, "suspend")}
                        className="rounded-lg bg-[#f6d2ce] p-1.5 text-[#b3261e] transition hover:brightness-95"
                        title="تعلیق"
                      >
                        <ShieldAlert size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => act(t.id, "unsuspend")}
                        className="rounded-lg bg-[#e0f0e6] p-1.5 text-[#2f7a55] transition hover:brightness-95"
                        title="لغو تعلیق"
                      >
                        <ShieldCheck size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── مودال افزودن معلم ── */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onMouseDown={() => setShowAdd(false)}
        >
          <div
            className="card-lux w-full max-w-md space-y-4 p-6"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">افزودن معلم جدید</h3>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                aria-label="بستن"
                className="rounded-lg p-1 transition hover:bg-white/30"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-extrabold">نام و نام خانوادگی</label>
              <input
                className={inputCls}
                placeholder="مثلاً: سارا محمدی"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-extrabold">ایمیل</label>
              <input
                className={inputCls}
                placeholder="teacher@example.com"
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-extrabold">رمز موقت</label>
              <input
                className={inputCls}
                placeholder="حداقل ۸ کاراکتر"
                type="text"
                dir="ltr"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <p className="rounded-xl bg-[var(--c-surface-2)] p-3 text-[11px] leading-relaxed text-[var(--c-ink-soft)]">
              💡 معلم با این رمز وارد می‌شه و در اولین ورود، سیستم ازش می‌خواد رمز رو تغییر بده.
              یک workspace خالی هم به‌صورت خودکار براش ساخته می‌شه.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 rounded-full bg-white/40 py-2.5 text-sm font-extrabold transition hover:bg-white/60"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={doCreate}
                disabled={saving}
                className="btn-primary flex-1 rounded-full py-2.5 text-sm font-extrabold shadow-lg transition disabled:opacity-60"
              >
                {saving ? "..." : "ساخت معلم"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
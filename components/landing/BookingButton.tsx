"use client";

import { useState } from "react";
import { CalendarCheck, X } from "lucide-react";
import { createBookingRequest } from "@/lib/server/landing-actions";

const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/60 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

export default function BookingButton({
  slug,
  label,
  accent,
}: {
  slug: string;
  label: string;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setErr("نام و شماره تماس الزامی است");
      return;
    }
    setBusy(true);
    const res = await createBookingRequest(slug, form);
    setBusy(false);
    if (res.ok) setDone(true);
    else setErr("خطا در ثبت درخواست");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full px-7 py-3 text-sm font-extrabold text-white shadow-lg transition hover:scale-105"
        style={{ background: accent }}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="card-lux w-full max-w-md space-y-4 p-6"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: accent }}>
                  <CalendarCheck size={24} />
                </div>
                <h3 className="text-base font-extrabold">درخواستت ثبت شد!</h3>
                <p className="mt-2 text-xs text-[var(--c-ink-soft)]">
                  معلم به‌زودی باهات تماس می‌گیره.
                </p>
                <button type="button" onClick={() => setOpen(false)} className="btn-primary mt-4 rounded-full px-6 py-2 text-sm font-extrabold">
                  بستن
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold">رزرو جلسه‌ی اول</h3>
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/30">
                    <X size={18} />
                  </button>
                </div>
                <input className={inputCls} placeholder="نام و نام خانوادگی" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className={inputCls} placeholder="شماره تماس" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <textarea className={inputCls + " min-h-[70px]"} placeholder="توضیح (اختیاری)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                {err && <p className="text-[11px] font-bold text-[#b3261e]">{err}</p>}
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  className="w-full rounded-full py-2.5 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"
                  style={{ background: accent }}
                >
                  {busy ? "..." : "ثبت درخواست"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
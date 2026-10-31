"use client";
import ExportButtons from "@/components/export/ExportButtons";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, Users, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import { createStudent } from "@/lib/server/actions";
import StudentCard from "@/components/students/StudentCard";
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/40 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

/* ── فرم در کامپوننت جدا: هویت پایدار + state محلی = بدون پرش فوکوس ── */
function StudentForm({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const tf = useTranslations("Forms");
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("A1");
  const [term, setTerm] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast(tf("errors.required"));
    if (phone && !/^09\d{9}$/.test(phone)) return toast(tf("errors.invalidPhone"));
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast(tf("errors.invalidEmail"));
    if (!term.trim()) return toast(tf("errors.required"));

    setSaving(true);
    try {
      await createStudent({
        name: name.trim(),
        phone,
        email: email || null,
        level,
        term: term.trim(),
        active: true,
      });
      toast(tf("studentAdded"));
      await onDone();
      onClose();
    } catch {
      toast(tf("saveError"));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="glass-strong max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[24px] p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{tf("newStudent")}</h2>
          <button type="button" onClick={onClose} aria-label={tf("cancel")} className="rounded-lg p-1 transition hover:bg-white/30">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("name")}</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder={tf("namePh")} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("phone")}</label>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={tf("phonePh")} inputMode="numeric" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("email")}</label>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={tf("emailPh")} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("level")}</label>
            <select className={inputCls} value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("term")}</label>
            <input className={inputCls} value={term} onChange={(e) => setTerm(e.target.value)} placeholder={tf("termPh")} />
          </div>

          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full bg-white/30 py-2.5 text-sm font-extrabold transition hover:bg-white/40"
            >
              {tf("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 rounded-full py-2.5 text-sm font-extrabold shadow-lg transition disabled:opacity-60"
            >
              {saving ? tf("loading") : tf("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentsClient({ title, subtitle }: { title: string; subtitle: string }) {
  const t = useTranslations("Pages");
  const { data, loading, refresh } = useAppData();
  const [open, setOpen] = useState(false);

  const students = data?.students ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-[var(--c-ink-soft)]">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons type="students" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-lg transition"
          >
            <UserPlus size={16} />
            {t("addStudent")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          fa={{
            title: "هنوز شاگردی نداری",
            hint: "اولین شاگردت رو اضافه کن تا پروفایل، جلسات و پرداخت‌هاش این‌جا چیده بشه.",
          }}
          en={{
            title: "No students yet",
            hint: "Add your first student to see their profile, sessions and payments here.",
          }}
          actionLabel={t("addStudent")}
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => (
            <Link key={s.id} href={`/students/${s.id}`} className="block h-full">
              <Card hoverable className="flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-extrabold">{s.name}</p>
                    <p className="mt-1 text-xs text-[var(--c-ink-soft)]">
                      {s.level} — {t("term")}: {s.term}
                    </p>
                  </div>
                  <Badge tone={s.active ? "success" : "info"}>
                    {s.active ? t("active") : t("inactive")}
                  </Badge>
                </div>
                {s.phone && <p className="mt-3 text-xs text-[var(--c-ink-soft)]">{s.phone}</p>}
                {s.email && <p className="mt-1 text-xs text-[var(--c-ink-soft)]">{s.email}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {open && <StudentForm onClose={() => setOpen(false)} onDone={refresh} />}
    </div>
  );
}
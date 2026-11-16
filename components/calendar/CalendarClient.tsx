"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Search, Trash2, X, Check, Undo2, GripVertical,
} from "lucide-react";
import {
  FA_MONTHS, FA_WEEKDAYS, EN_WEEKDAYS, toFaDigits, dateToJalali, jalaliToDate,
  jalaliMonthLength, gregorianMonthLength, isoOf, timeOf,
} from "@/lib/shamsi";
import {
  createCalendarSession, updateCalendarSession, deleteCalendarSession,
  type CalendarSessionRow, type CalendarDraft,
} from "@/lib/server/calendar-actions";

const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/50 px-3 py-2 text-sm font-bold outline-none transition focus:border-[#D94F63]";

type Cell = { iso: string; day: number } | null;

const STATUS_META: Record<string, { fa: string; en: string; chip: string; dot: string }> = {
  SCHEDULED: { fa: "پیش رو", en: "Upcoming", chip: "bg-[#f8d8e0] text-[#c2586b]", dot: "#d94f63" },
  COMPLETED: { fa: "برگزار شده", en: "Completed", chip: "bg-[#e0f0e6] text-[#2f7a55]", dot: "#2f9e6e" },
  CANCELLED: { fa: "لغو شده", en: "Cancelled", chip: "bg-[#ece5df] text-[#8a7a72]", dot: "#a8968c" },
};

export default function CalendarClient({
  initial,
}: {
  initial: { sessions: CalendarSessionRow[]; students: { id: string; name: string }[] };
}) {
  const locale = useLocale();
  const fa = locale === "fa";
  const num = (v: string | number) => (fa ? toFaDigits(v) : String(v));

  const [sessions, setSessions] = useState(initial.sessions);
  const [students] = useState(initial.students);
  const today = new Date();
  const todayIso = isoOf(today);
  const startCursor = fa
    ? (() => { const j = dateToJalali(today); return { y: j.jy, m: j.jm }; })()
    : { y: today.getFullYear(), m: today.getMonth() + 1 };
  const [cursor, setCursor] = useState(startCursor);

  const [query, setQuery] = useState("");
  const [fStudent, setFStudent] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [editing, setEditing] = useState<(CalendarDraft & { id?: string }) | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIso, setDropIso] = useState<string | null>(null);
  const [undo, setUndo] = useState<CalendarSessionRow | null>(null);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 7000);
    return () => clearTimeout(t);
  }, [undo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setEditing(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── شبکه‌ی ماه ── */
  const { cells, monthLabel, weekdays } = useMemo(() => {
    let lead: number, len: number, label: string;
    const wd = fa ? FA_WEEKDAYS : EN_WEEKDAYS;
    if (fa) {
      const first = jalaliToDate(cursor.y, cursor.m, 1);
      lead = (first.getDay() + 1) % 7;
      len = jalaliMonthLength(cursor.y, cursor.m);
      label = `${FA_MONTHS[cursor.m - 1]} ${num(cursor.y)}`;
    } else {
      const first = new Date(cursor.y, cursor.m - 1, 1);
      lead = first.getDay();
      len = gregorianMonthLength(cursor.y, cursor.m);
      label = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    const arr: Cell[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= len; d++) {
      const date = fa ? jalaliToDate(cursor.y, cursor.m, d) : new Date(cursor.y, cursor.m - 1, d);
      arr.push({ iso: isoOf(date), day: d });
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return { cells: arr, monthLabel: label, weekdays: wd };
  }, [cursor, fa]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (fStudent && s.studentId !== fStudent) return false;
      if (fStatus && s.status !== fStatus) return false;
      if (q && !`${s.topic} ${s.studentName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sessions, query, fStudent, fStatus]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarSessionRow[]>();
    for (const s of visible) {
      const k = isoOf(new Date(s.date));
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    for (const list of m.values()) list.sort((a, b) => a.date.localeCompare(b.date));
    return m;
  }, [visible]);

  const monthSessions = useMemo(
    () => visible.filter((s) => cells.some((c) => c && c.iso === isoOf(new Date(s.date)))),
    [visible, cells]
  );

  const shiftMonth = (dir: -1 | 1) =>
    setCursor((c) => {
      let m = c.m + dir, y = c.y;
      if (m < 1) { m = 12; y -= 1; }
      if (m > 12) { m = 1; y += 1; }
      return { y, m };
    });

  /* ── عملیات ── */
  const openCreate = (iso?: string) => {
    setConfirmDelete(false);
    setErr("");
    setEditing({
      studentId: students[0]?.id ?? "",
      date: iso ?? todayIso,
      time: "09:00",
      topic: "",
      status: "SCHEDULED",
      score: "",
    });
  };

  const openEdit = (s: CalendarSessionRow) => {
    const d = new Date(s.date);
    setConfirmDelete(false);
    setErr("");
    setEditing({
      id: s.id, studentId: s.studentId, date: isoOf(d), time: timeOf(d),
      topic: s.topic, status: s.status, score: s.score == null ? "" : String(s.score),
    });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.studentId || !editing.date) { setErr(fa ? "شاگرد و تاریخ الزامی است" : "Student and date required"); return; }
    setBusy(true);
    const { id, ...draft } = editing;
    const res = id ? await updateCalendarSession(id, draft) : await createCalendarSession(draft);
    setBusy(false);
    if (res.ok && res.row) {
      const row = res.row;
      setSessions((l) => (id ? l.map((s) => (s.id === id ? row : s)) : [...l, row]));
      setEditing(null);
    } else setErr(fa ? "ذخیره نشد — دوباره تلاش کن" : "Save failed");
  };

  const patchLocal = (id: string, patch: Partial<CalendarSessionRow>) =>
    setSessions((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const move = async (id: string, iso: string) => {
    const s = sessions.find((x) => x.id === id);
    if (!s || isoOf(new Date(s.date)) === iso) return;
    const time = timeOf(new Date(s.date));
    const prev = s.date;
    patchLocal(id, { date: new Date(`${iso}T${time}:00`).toISOString() });
    const res = await updateCalendarSession(id, { date: iso, time });
    if (!res.ok) { patchLocal(id, { date: prev }); setErr(fa ? "جابجایی ناموفق" : "Move failed"); }
  };

  const toggleStatus = async (s: CalendarSessionRow) => {
    const next = s.status === "COMPLETED" ? "SCHEDULED" : "COMPLETED";
    patchLocal(s.id, { status: next });
    const res = await updateCalendarSession(s.id, { status: next });
    if (!res.ok) patchLocal(s.id, { status: s.status });
  };

  const remove = async () => {
    if (!editing?.id) return;
    const row = sessions.find((s) => s.id === editing.id);
    if (!row) return;
    setSessions((l) => l.filter((s) => s.id !== row.id));
    setEditing(null);
    setUndo(row);
    await deleteCalendarSession(row.id);
  };

  const restore = async () => {
    if (!undo) return;
    const row = undo;
    setUndo(null);
    const d = new Date(row.date);
    const res = await createCalendarSession({
      studentId: row.studentId, date: isoOf(d), time: timeOf(d),
      topic: row.topic, status: row.status, score: row.score == null ? "" : String(row.score),
    });
    if (res.ok && res.row) setSessions((l) => [...l, res.row!]);
  };

  const chipCls = (st: string) => STATUS_META[st]?.chip ?? STATUS_META.SCHEDULED.chip;

  return (
    <div className="space-y-5">
      {/* هدر */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <CalendarDays size={22} className="text-[#d94f63]" />
            {fa ? "تقویم کلاس" : "Class calendar"}
          </h1>
          <p className="mt-1 text-xs text-[var(--c-ink-soft)]">
            {fa
              ? "روی هر روز کلیک کن تا جلسه بسازی؛ روی جلسه کلیک کن تا ویرایش شود؛ بکش و رها کن تا جابجا شود."
              : "Click a day to add, click a session to edit, drag to reschedule."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-lg transition hover:scale-105"
        >
          <Plus size={16} /> {fa ? "جلسه‌ی جدید" : "New session"}
        </button>
      </div>

      {err && (
        <div className="flex items-center justify-between rounded-2xl bg-[#f6d2ce] px-4 py-2 text-xs font-extrabold text-[#b3261e]">
          {err}
          <button type="button" onClick={() => setErr("")}><X size={14} /></button>
        </div>
      )}

      {/* نوار ابزار */}
      <div className="card-lux flex flex-wrap items-center gap-2 p-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="prev" className="rounded-xl bg-white/50 p-2 transition hover:bg-white/80">
            <ChevronRight size={16} className={fa ? "" : "rotate-180"} />
          </button>
          <p className="min-w-[130px] text-center text-sm font-extrabold">{monthLabel}</p>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="next" className="rounded-xl bg-white/50 p-2 transition hover:bg-white/80">
            <ChevronLeft size={16} className={fa ? "" : "rotate-180"} />
          </button>
        </div>
        <button type="button" onClick={() => setCursor(startCursor)} className="rounded-full bg-[#4a2430] px-4 py-1.5 text-[11px] font-extrabold text-[#f6eede]">
          {fa ? "امروز" : "Today"}
        </button>
        <span className="chip-lux bg-[#f6e7c6] text-[#b3701f]">
          {num(monthSessions.length)} {fa ? "جلسه در این ماه" : "sessions this month"}
        </span>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--c-ink-soft)] ltr:left-3 rtl:right-3" />
            <input
              className={inputCls + " w-40 ltr:pl-8 rtl:pr-8"}
              placeholder={fa ? "جستجو…" : "Search…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className={inputCls + " w-36"} value={fStudent} onChange={(e) => setFStudent(e.target.value)}>
            <option value="">{fa ? "همه‌ی شاگردها" : "All students"}</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className={inputCls + " w-32"} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="">{fa ? "همه‌ی وضعیت‌ها" : "All statuses"}</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{fa ? v.fa : v.en}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
        {/* شبکه‌ی ماه */}
        <div className="card-lux p-4">
          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-extrabold text-[var(--c-ink-soft)]">
            {weekdays.map((w) => <div key={w}>{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((c, i) =>
              c === null ? (
                <div key={`b${i}`} className="min-h-[96px] rounded-2xl bg-white/10" />
              ) : (
                <div
                  key={c.iso}
                  onClick={() => openCreate(c.iso)}
                  onDragOver={(e) => { e.preventDefault(); setDropIso(c.iso); }}
                  onDragLeave={() => setDropIso((d) => (d === c.iso ? null : d))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain") || dragId;
                    setDropIso(null); setDragId(null);
                    if (id) move(id, c.iso);
                  }}
                  className={`group min-h-[96px] cursor-pointer rounded-2xl border p-1.5 transition ${
                    dropIso === c.iso
                      ? "border-[#d94f63] bg-[#f6e7c6]"
                      : c.iso === todayIso
                      ? "border-[#d94f63]/60 bg-white/60 ring-2 ring-[#d94f63]/30"
                      : "border-white/40 bg-white/30 hover:bg-white/55"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span className={`text-[11px] font-extrabold ${c.iso === todayIso ? "text-[#d94f63]" : "text-[var(--c-ink-soft)]"}`}>
                      {num(c.day)}
                    </span>
                    <Plus size={11} className="opacity-0 transition group-hover:opacity-60" />
                  </div>
                  <div className="flex flex-col gap-1">
                    {(byDay.get(c.iso) ?? []).slice(0, 3).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData("text/plain", s.id); setDragId(s.id); }}
                        onDragEnd={() => { setDragId(null); setDropIso(null); }}
                        onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                        title={`${s.studentName} — ${s.topic}`}
                        className={`flex items-center gap-1 truncate rounded-lg px-1.5 py-1 text-[10px] font-extrabold transition hover:brightness-95 ${chipCls(s.status)} ${dragId === s.id ? "opacity-40" : ""} ${s.status === "CANCELLED" ? "line-through" : ""}`}
                      >
                        <GripVertical size={9} className="shrink-0 opacity-50" />
                        <span className="truncate">{num(timeOf(new Date(s.date)))} {s.studentName}</span>
                      </button>
                    ))}
                    {(byDay.get(c.iso) ?? []).length > 3 && (
                      <span className="px-1 text-[9px] font-bold text-[var(--c-ink-soft)]">
                        +{num((byDay.get(c.iso) ?? []).length - 3)}
                      </span>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold text-[var(--c-ink-soft)]">
            {Object.entries(STATUS_META).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: v.dot }} />
                {fa ? v.fa : v.en}
              </span>
            ))}
          </div>
        </div>

        {/* لیست ماه */}
        <div className="card-lux flex max-h-[640px] flex-col p-4">
          <h2 className="mb-3 text-sm font-extrabold">{fa ? "جلسات این ماه" : "This month"}</h2>
          <div className="cal-scroll flex-1 space-y-2 overflow-y-auto pe-1">
            {monthSessions.length === 0 && (
              <p className="rounded-2xl bg-white/30 p-4 text-center text-xs text-[var(--c-ink-soft)]">
                {fa ? "جلسه‌ای در این ماه نیست — روی یک روز کلیک کن." : "No sessions this month — click a day."}
              </p>
            )}
            {monthSessions.map((s) => {
              const d = new Date(s.date);
              return (
                <div key={s.id} className="rounded-2xl bg-white/40 p-3 transition hover:bg-white/65">
                  <div className="flex items-center justify-between gap-2">
                    <button type="button" onClick={() => openEdit(s)} className="min-w-0 flex-1 text-start">
                      <p className="truncate text-xs font-extrabold">{s.studentName}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--c-ink-soft)]">
                        {fa ? toFaDigits(isoOf(d)) : isoOf(d)} • {num(timeOf(d))}
                        {s.topic ? ` • ${s.topic}` : ""}
                      </p>
                    </button>
                    <span className={`chip-lux shrink-0 ${chipCls(s.status)}`}>
                      {fa ? STATUS_META[s.status]?.fa : STATUS_META[s.status]?.en}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => toggleStatus(s)}
                      className="flex items-center gap-1 rounded-lg bg-[#e0f0e6] px-2 py-1 text-[10px] font-extrabold text-[#2f7a55] transition hover:brightness-95"
                    >
                      <Check size={11} />
                      {s.status === "COMPLETED" ? (fa ? "برگشت به پیش رو" : "Reopen") : (fa ? "برگزار شد" : "Done")}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="rounded-lg bg-white/60 px-2 py-1 text-[10px] font-extrabold text-[var(--c-ink-soft)] transition hover:bg-white/90"
                    >
                      {fa ? "ویرایش" : "Edit"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* مودال ویرایش */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onMouseDown={() => setEditing(null)}>
          <div className="card-lux w-full max-w-lg space-y-3 p-6" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editing.id ? (fa ? "ویرایش جلسه" : "Edit session") : (fa ? "جلسه‌ی جدید" : "New session")}
              </h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="close" className="rounded-lg p-1 hover:bg-white/30"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="mb-1 block text-[10px] font-extrabold text-[var(--c-ink-soft)]">{fa ? "شاگرد" : "Student"}</label>
                <select className={inputCls} value={editing.studentId} onChange={(e) => setEditing({ ...editing, studentId: e.target.value })}>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-extrabold text-[var(--c-ink-soft)]">{fa ? "تاریخ" : "Date"}</label>
                <input type="date" dir="ltr" className={inputCls} value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-extrabold text-[var(--c-ink-soft)]">{fa ? "ساعت" : "Time"}</label>
                <input type="time" dir="ltr" className={inputCls} value={editing.time} onChange={(e) => setEditing({ ...editing, time: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-[10px] font-extrabold text-[var(--c-ink-soft)]">{fa ? "موضوع جلسه" : "Topic"}</label>
                <input className={inputCls} placeholder={fa ? "مثلاً: حال کامل" : "e.g. Present perfect"} value={editing.topic} onChange={(e) => setEditing({ ...editing, topic: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-extrabold text-[var(--c-ink-soft)]">{fa ? "وضعیت" : "Status"}</label>
                <select className={inputCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{fa ? v.fa : v.en}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-extrabold text-[var(--c-ink-soft)]">{fa ? "نمره (۰ تا ۲۰)" : "Score (0–20)"}</label>
                <input type="number" min={0} max={20} dir="ltr" className={inputCls} value={editing.score} onChange={(e) => setEditing({ ...editing, score: e.target.value })} />
              </div>
            </div>

            {err && <p className="text-[11px] font-extrabold text-[#b3261e]">{err}</p>}

            <div className="flex gap-2 pt-1">
              {editing.id && (
                <button
                  type="button"
                  onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
                  className={`flex items-center gap-1 rounded-full px-4 py-2.5 text-xs font-extrabold transition ${confirmDelete ? "bg-[#b3261e] text-white" : "bg-[#f6d2ce] text-[#b3261e]"}`}
                >
                  <Trash2 size={13} />
                  {confirmDelete ? (fa ? "مطمئنی؟ حذف کن" : "Confirm delete") : (fa ? "حذف" : "Delete")}
                </button>
              )}
              <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded-full bg-white/50 py-2.5 text-sm font-extrabold transition hover:bg-white/75">
                {fa ? "انصراف" : "Cancel"}
              </button>
              <button type="button" onClick={save} disabled={busy} className="btn-primary flex-1 rounded-full py-2.5 text-sm font-extrabold shadow-lg disabled:opacity-60">
                {busy ? "…" : fa ? "ذخیره" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* بنر بازگردانی */}
      {undo && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#4a2430] px-5 py-3 text-xs font-extrabold text-[#f6eede] shadow-2xl">
          {fa ? "جلسه حذف شد" : "Session deleted"}
          <button type="button" onClick={restore} className="flex items-center gap-1 rounded-full bg-[#f2a9bc] px-3 py-1.5 text-[#4a2430] transition hover:brightness-105">
            <Undo2 size={13} /> {fa ? "بازگردانی" : "Undo"}
          </button>
        </div>
      )}

      <style jsx global>{`
        .cal-scroll::-webkit-scrollbar { width: 8px; }
        .cal-scroll::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.25); border-radius: 8px; }
        .cal-scroll::-webkit-scrollbar-thumb { background: #d94f63; border-radius: 8px; }
        .cal-scroll::-webkit-scrollbar-thumb:hover { background: #b23a4c; }
        .cal-scroll { scrollbar-width: thin; scrollbar-color: #d94f63 rgba(255, 255, 255, 0.25); }
      `}</style>
    </div>
  );
}
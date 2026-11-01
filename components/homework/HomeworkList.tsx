"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { BookOpen, Check, Clock, Send, Star, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { toFa } from "@/lib/jalali";
import {
  createHomework,
  submitHomework,
  gradeHomework,
  type HomeworkItem,
} from "@/lib/server/portal-actions";

const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/40 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

/* ═══════════ FORM: ساخت تکلیف (معلم) ═══════════ */
export function NewHomeworkForm({
  students,
  onDone,
  onClose,
}: {
  students: { id: string; name: string }[];
  onDone: () => void;
  onClose: () => void;
}) {
  const locale = useLocale();
  const fa = locale === "fa";
  const toast = useToast();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !studentId) return;
    setSaving(true);
    const res = await createHomework({ studentId, title: title.trim(), description, dueDate });
    if (res.ok) {
      toast(fa ? "✅ تکلیف ساخته شد" : "✅ Homework created");
      onDone();
      onClose();
    } else {
      toast(fa ? "❌ خطا در ساخت تکلیف" : "❌ Failed");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="card-lux space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold">{fa ? "تکلیف جدید" : "New homework"}</h3>
        <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-white/30">
          <X size={18} />
        </button>
      </div>

      <select className={inputCls} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <input
        className={inputCls}
        placeholder={fa ? "عنوان تکلیف" : "Title"}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className={inputCls + " min-h-[80px]"}
        placeholder={fa ? "توضیحات (اختیاری)" : "Description (optional)"}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        className={inputCls}
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full bg-white/40 py-2.5 text-sm font-extrabold"
        >
          {fa ? "انصراف" : "Cancel"}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex-1 rounded-full py-2.5 text-sm font-extrabold shadow-lg"
        >
          {saving ? "..." : fa ? "ثبت تکلیف" : "Create"}
        </button>
      </div>
    </form>
  );
}

/* ═══════════ CARD: تکلیف ═══════════ */
export function HomeworkCard({
  item,
  role,
  onRefresh,
}: {
  item: HomeworkItem;
  role: "TEACHER" | "STUDENT";
  onRefresh: () => void;
}) {
  const locale = useLocale();
  const fa = locale === "fa";
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(item.submissionText);
  const [grading, setGrading] = useState(false);
  const [score, setScore] = useState(item.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(item.feedback);

  const statusColor =
    item.status === "GRADED"
      ? "bg-[#e0f0e6] text-[#2f7a55]"
      : item.status === "SUBMITTED"
      ? "bg-[#f6e7c6] text-[#b3701f]"
      : "bg-[#f8d8e0] text-[#c2586b]";

  const statusLabel =
    item.status === "GRADED"
      ? fa ? "تصحیح‌شده" : "Graded"
      : item.status === "SUBMITTED"
      ? fa ? "تحویل داده شده" : "Submitted"
      : fa ? "در انتظار تحویل" : "Open";

  const doSubmit = async () => {
    if (!submission.trim()) return;
    setSubmitting(true);
    const res = await submitHomework(item.id, submission);
    if (res.ok) {
      toast(fa ? "✅ تحویل داده شد" : "✅ Submitted");
      onRefresh();
    } else {
      toast(fa ? "❌ خطا" : "❌ Error");
    }
    setSubmitting(false);
  };

  const doGrade = async () => {
    setGrading(true);
    const numScore = score.trim() === "" ? null : Number(score);
    const res = await gradeHomework(item.id, numScore, feedback);
    if (res.ok) {
      toast(fa ? "✅ تصحیح ثبت شد" : "✅ Graded");
      onRefresh();
    } else {
      toast(fa ? "❌ خطا" : "❌ Error");
    }
    setGrading(false);
  };

  return (
    <div className="card-lux p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="shrink-0 text-[#d94f63]" />
            <h3 className="truncate text-sm font-extrabold">{item.title}</h3>
          </div>
          {item.studentName && (
            <p className="mt-0.5 text-[11px] text-[var(--c-ink-soft)]">
              {fa ? "شاگرد:" : "Student:"} {item.studentName}
            </p>
          )}
        </div>
        <span className={`chip-lux shrink-0 ${statusColor}`}>
          <Star size={10} />
          {statusLabel}
        </span>
      </div>

      {item.description && (
        <p className="mt-3 whitespace-pre-wrap text-xs text-[var(--c-ink-soft)]">{item.description}</p>
      )}

      {item.dueDate && (
        <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[var(--c-ink-soft)]">
          <Clock size={11} />
          {fa ? `مهلت: ${toFa(item.dueDate)}` : `Due: ${item.dueDate}`}
        </p>
      )}

      {/* ── منطقه‌ی شاگرد: تحویل ── */}
      {role === "STUDENT" && item.status !== "GRADED" && (
        <div className="mt-4 space-y-2 border-t border-[var(--c-primary)]/10 pt-4">
          <textarea
            className={inputCls + " min-h-[80px]"}
            placeholder={fa ? "متن پاسخ تکلیف..." : "Your answer..."}
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
          />
          <button
            type="button"
            onClick={doSubmit}
            disabled={submitting || !submission.trim()}
            className="btn-primary flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-extrabold disabled:opacity-60"
          >
            <Send size={14} />
            {submitting ? "..." : fa ? "تحویل تکلیف" : "Submit"}
          </button>
        </div>
      )}

      {role === "STUDENT" && item.submissionText && (
        <div className="mt-3 rounded-2xl bg-[#f6e7c6]/60 p-3">
          <p className="mb-1 text-[10px] font-extrabold text-[#7c5a63]">
            {fa ? "پاسخ تحویل‌داده‌شده:" : "Your submission:"}
          </p>
          <p className="whitespace-pre-wrap text-xs">{item.submissionText}</p>
        </div>
      )}

      {/* ── منطقه‌ی معلم: تصحیح ── */}
      {role === "TEACHER" && item.submissionText && (
        <div className="mt-4 space-y-3 border-t border-[var(--c-primary)]/10 pt-4">
          <div className="rounded-2xl bg-[#f6e7c6]/60 p-3">
            <p className="mb-1 text-[10px] font-extrabold text-[#7c5a63]">
              {fa ? "پاسخ شاگرد:" : "Student submission:"}
            </p>
            <p className="whitespace-pre-wrap text-xs">{item.submissionText}</p>
          </div>

          <div className="grid grid-cols-[80px_1fr] gap-2">
            <input
              className={inputCls}
              type="number"
              min={0}
              max={20}
              placeholder={fa ? "نمره" : "Score"}
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
            <input
              className={inputCls}
              placeholder={fa ? "بازخورد (اختیاری)" : "Feedback (optional)"}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={doGrade}
            disabled={grading}
            className="btn-primary flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-extrabold disabled:opacity-60"
          >
            <Check size={14} />
            {grading ? "..." : fa ? "ثبت تصحیح" : "Save grade"}
          </button>
        </div>
      )}

      {/* ── نتیجه‌ی تصحیح (هر دو نقش) ── */}
      {item.status === "GRADED" && (
        <div className="mt-3 rounded-2xl bg-[#e0f0e6] p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-extrabold text-[#2f7a55]">
              {item.score ?? "—"}
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#2f7a55]">{fa ? "نمره" : "Score"}</p>
              <p className="text-[11px] text-[#2f7a55]">/ {fa ? "۲۰" : "20"}</p>
            </div>
          </div>
          {item.feedback && (
            <p className="mt-2 whitespace-pre-wrap text-xs text-[#2f7a55]">{item.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}
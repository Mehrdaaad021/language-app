"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { NotebookPen, Paperclip, X, FileText } from "lucide-react";
import Card from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import { createNote } from "@/lib/server/actions";
import { uploadAttachment, type Attachment } from "@/lib/server/upload-actions";

const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/40 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

/* ── نمایش پیوست‌ها: اول URL امضاشده‌ی موقت (preview)، در غیر این صورت url سرور ── */
function AttachmentChips({ items }: { items: Attachment[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((a) =>
        a.kind === "image" ? (
          <a
            key={a.id}
            href={a.preview ?? a.url}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-lg ring-1 ring-white/30"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.preview ?? a.url} alt={a.name} className="h-16 w-16 object-cover" />
          </a>
        ) : (
          <a
            key={a.id}
            href={a.preview ?? a.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-white/30 px-2.5 py-1.5 text-[10px] font-extrabold transition hover:bg-white/40"
          >
            <FileText size={12} />
            {a.name}
          </a>
        )
      )}
    </div>
  );
}

function NoteForm({
  onClose,
  onDone,
  students,
}: {
  onClose: () => void;
  onDone: () => Promise<void>;
  students: { id: string; name: string }[];
}) {
  const tf = useTranslations("Forms");
  const tp = useTranslations("Profile");
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    if (attachments.length + files.length > 4) return toast(tp("tooManyFiles"));
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await uploadAttachment(fd);
        if (!res.ok) {
          toast(res.error === "tooBig" ? tp("fileTooBig") : tf("saveError"));
        } else {
          setAttachments((prev) => [...prev, { ...res.attachment, preview: res.preview }]);
        }
      } catch {
        toast(tf("saveError"));
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return toast(tf("errors.required"));
    if (!title.trim()) return toast(tf("errors.required"));
    if (!content.trim()) return toast(tf("errors.required"));
    if (!date) return toast(tf("errors.required"));

    setSaving(true);
    try {
      // فقط مسیر فایل در دیتابیس ذخیره می‌شه (نه URL امضاشده‌ی موقت)
      const clean = attachments.map(({ preview, ...rest }) => rest);
      await createNote({ studentId, title: title.trim(), content: content.trim(), date, attachments: clean });
      toast(tp("noteAdded"));
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
        className="glass-strong max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 text-lg font-extrabold">{tp("newNote")}</h2>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("student")}</label>
            <select className={inputCls} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">{tf("chooseStudent")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-extrabold">{tp("noteTitle")}</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tp("noteTitlePh")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-extrabold">{tp("noteContent")}</label>
            <textarea
              className={`${inputCls} min-h-32`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={tp("noteContentPh")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("date")}</label>
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-extrabold">{tp("upload")}</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/50 bg-white/20 py-3 text-xs font-extrabold transition hover:bg-white/30 disabled:opacity-60"
            >
              <Paperclip size={14} />
              {uploading ? "…" : tp("uploadHint")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              multiple
              hidden
              onChange={(e) => onFiles(e.target.files)}
            />
            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <span key={a.id} className="flex items-center gap-1.5 rounded-lg bg-white/30 px-2.5 py-1.5 text-[10px] font-extrabold">
                    {a.kind === "image" ? "🖼" : "📄"} {a.name}
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                      className="transition hover:text-[#B23A4C]"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
              disabled={saving || uploading}
              className="flex-1 rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:brightness-105 disabled:opacity-60"
            >
              {saving ? tf("loading") : tf("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NotesClient({ title, subtitle }: { title: string; subtitle: string }) {
  const t = useTranslations("Pages");
  const { data, loading, refresh } = useAppData();
  const [open, setOpen] = useState(false);

  const notes = data?.notes ?? [];
  const students = data?.students ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:brightness-105"
        >
          <NotebookPen size={16} />
          {t("addNote")}
        </button>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/25" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl bg-white/25 p-12 text-center">
          <p className="text-sm text-[var(--color-ink-soft)]">هنوز یادداشتی ثبت نشده</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((n) => {
            const student = students.find((s) => s.id === n.studentId);
            return (
              <Card key={n.id} className="flex h-full flex-col">
                <p className="font-extrabold">{n.title}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                  {student?.name ?? "—"} — {n.date}
                </p>
                <p className="mt-3 flex-1 whitespace-pre-wrap text-xs leading-6 text-[var(--color-ink-soft)]">
                  {n.content.slice(0, 200)}
                  {n.content.length > 200 && "…"}
                </p>
                <AttachmentChips items={n.attachments ?? []} />
              </Card>
            );
          })}
        </div>
      )}

      {open && <NoteForm onClose={() => setOpen(false)} onDone={refresh} students={students} />}
    </div>
  );
}
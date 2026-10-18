"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { ImagePlus, X, FileText } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import { mapZodErrors } from "@/lib/format";
import type { Attachment } from "@/lib/mock-data";

const MAX_SIZE = 1.5 * 1024 * 1024;
const MAX_COUNT = 4;

const AREA_CLASS =
  "w-full rounded-2xl border border-white/60 bg-white/40 px-4 py-3 text-sm font-medium leading-7 text-[var(--color-ink)] backdrop-blur-md transition placeholder:text-[var(--color-ink-soft)]/60 focus:border-white/90 focus:bg-white/55 focus:outline-none";

export default function NewNoteModal({ open, onClose, studentId }: { open: boolean; onClose: () => void; studentId: string }) {
  const t = useTranslations("Profile");
  const tf = useTranslations("Forms");
  const toast = useToast();
  const { addNote } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schema = z.object({
    title: z.string().trim().min(1, "required"),
    content: z.string().trim().min(1, "required"),
  });

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (attachments.length + files.length > MAX_COUNT) {
      toast(t("tooManyFiles"));
      return;
    }
    Array.from(files).forEach((f) => {
      if (f.size > MAX_SIZE) {
        toast(t("fileTooBig"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: f.name,
            kind: f.type.startsWith("image/") ? "image" : "file",
            url: String(reader.result),
          },
        ]);
      };
      reader.readAsDataURL(f);
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = schema.safeParse({ title, content });
    if (!res.success) {
      setErrors(mapZodErrors(res.error.issues));
      return;
    }
    addNote({
      studentId,
      title: res.data.title,
      content: res.data.content,
      date: new Date().toISOString().slice(0, 10),
      attachments,
    });
    toast(t("noteAdded"));
    setTitle(""); setContent(""); setAttachments([]); setErrors({});
    onClose();
  };

  const err = (k: string) => (errors[k] ? tf(`errors.${errors[k]}`) : undefined);

  return (
    <Modal open={open} onClose={onClose} title={t("newNote")}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={t("noteTitle")} placeholder={t("noteTitlePh")} value={title} error={err("title")} onChange={(e) => setTitle(e.target.value)} />

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[var(--color-ink-soft)]">{t("noteContent")}</span>
          <textarea rows={6} className={AREA_CLASS} placeholder={t("noteContentPh")} value={content} onChange={(e) => setContent(e.target.value)} />
          {err("content") && <span className="mt-1.5 block text-[11px] font-bold text-[#B23A4C]">{err("content")}</span>}
        </label>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/70 bg-white/25 px-4 py-6 text-xs font-bold text-[var(--color-ink-soft)] transition hover:bg-white/40"
        >
          <ImagePlus size={20} />
          {t("upload")}
          <span className="font-medium opacity-70">{t("uploadHint")}</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
        />

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-2 rounded-xl bg-white/40 px-3 py-2 text-[11px] font-bold backdrop-blur-md">
                {a.kind === "image" ? (
                  <img src={a.url} alt={a.name} className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <FileText size={14} />
                )}
                <span className="max-w-32 truncate">{a.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((p) => p.filter((x) => x.id !== a.id))}
                  className="text-[#B23A4C] transition hover:scale-110"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{tf("cancel")}</Button>
          <Button type="submit">{tf("submit")}</Button>
        </div>
      </form>
    </Modal>
  );
}
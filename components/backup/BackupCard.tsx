"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Download, Upload, DatabaseBackup } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { exportBackup, importBackup } from "@/lib/server/backup-actions";

export default function BackupCard() {
  const locale = useLocale();
  const fa = locale === "fa";
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);

  const doExport = async () => {
    setBusy("export");
    try {
      const res = await exportBackup();
      if (!res.ok) throw new Error(res.error);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(fa ? "✅ فایل بکاپ دانلود شد" : "✅ Backup downloaded");
    } catch {
      toast(fa ? "❌ خطا در تهیه‌ی بکاپ" : "❌ Backup failed");
    } finally {
      setBusy(null);
    }
  };

  const doImport = async (file: File) => {
    const confirmed = window.confirm(
      fa
        ? "⚠️ هشدار: همه‌ی داده‌های فعلی با محتوای فایل جایگزین می‌شن. ادامه می‌دی؟"
        : "⚠️ Warning: all current data will be REPLACED by this file. Continue?"
    );
    if (!confirmed) return;

    setBusy("import");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await importBackup(parsed);
      if (!res.ok) throw new Error(res.error);
      toast(
        fa
          ? `✅ بازیابی شد: ${res.counts.students} شاگرد، ${res.counts.sessions} جلسه`
          : `✅ Restored: ${res.counts.students} students, ${res.counts.sessions} sessions`
      );
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast(fa ? "❌ فایل بکاپ نامعتبر است" : "❌ Invalid backup file");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="rounded-3xl bg-[var(--c-surface)] p-6 shadow-[0_10px_30px_-18px_rgba(74,36,48,0.35)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f8d8e0] to-[#f6e7c6] text-[#4a2430]">
          <DatabaseBackup size={20} />
        </div>
        <div>
          <h2 className="text-base font-extrabold">
            {fa ? "بکاپ و بازیابی" : "Backup & Restore"}
          </h2>
          <p className="text-xs text-[var(--c-ink-soft)]">
            {fa
              ? "یه نسخه‌ی کامل JSON از همه‌ی داده‌هات بگیر یا بازیابی کن."
              : "Take or restore a full JSON snapshot of your data."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={doExport}
          disabled={busy !== null}
          className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-lg transition disabled:opacity-60"
        >
          <Download size={16} />
          {busy === "export" ? (fa ? "در حال تهیه..." : "Exporting...") : fa ? "دانلود بکاپ" : "Download backup"}
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
          className="flex items-center gap-2 rounded-full border-2 border-[#4a2430]/20 bg-white/60 px-5 py-2.5 text-sm font-extrabold text-[#4a2430] transition hover:bg-white/80 disabled:opacity-60"
        >
          <Upload size={16} />
          {busy === "import" ? (fa ? "در حال بازیابی..." : "Restoring...") : fa ? "بازیابی از فایل" : "Restore from file"}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
          }}
        />
      </div>
    </div>
  );
}
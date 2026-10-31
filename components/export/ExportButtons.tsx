"use client";

import { Download } from "lucide-react";
import { useLocale } from "next-intl";
import { useToast } from "@/components/ui/Toast";
import {
  exportStudentsCSV,
  exportPaymentsCSV,
  exportSessionsCSV,
} from "@/lib/server/export-actions";

export default function ExportButtons({ type }: { type: "students" | "payments" | "sessions" }) {
  const locale = useLocale();
  const fa = locale === "fa";
  const toast = useToast();

  const handleExport = async () => {
    try {
      let result: { csv: string; filename: string };

      if (type === "students") result = await exportStudentsCSV();
      else if (type === "payments") result = await exportPaymentsCSV();
      else result = await exportSessionsCSV();

      // ⭐ BOM اضافه می‌شه تا اکسل UTF-8 (فارسی) رو درست بخونه
      const blob = new Blob(["\uFEFF" + result.csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);

      toast(fa ? "✅ فایل CSV دانلود شد" : "✅ CSV file downloaded");
    } catch {
      toast(fa ? "❌ خطا در خروجی" : "❌ Export failed");
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 rounded-lg border border-[#4a2430]/20 bg-white/60 px-4 py-2 text-sm font-extrabold text-[#4a2430] transition hover:bg-white/80"
    >
      <Download size={16} />
      {fa ? "خروجی CSV" : "Export CSV"}
    </button>
  );
}
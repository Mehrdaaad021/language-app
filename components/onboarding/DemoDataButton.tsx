"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { createDemoData } from "@/lib/server/demo-actions";

export default function DemoDataButton({ locale }: { locale: string }) {
  const fa = locale === "fa";
  const toast = useToast();
  const [seeding, setSeeding] = useState(false);

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await createDemoData();
      if (res.ok) {
        toast(fa ? "✨ داده‌ی نمونه اضافه شد — صفحه رفرش می‌شود" : "✨ Sample data added — refreshing");
        setTimeout(() => window.location.reload(), 600);
      } else {
        toast(fa ? "از قبل داده داری" : "You already have data");
      }
    } catch {
      toast(fa ? "خطا در افزودن داده‌ی نمونه" : "Failed to add sample data");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <button
      type="button"
      onClick={seed}
      disabled={seeding}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white/60 py-2.5 text-xs font-extrabold text-[var(--c-primary)] transition hover:bg-white/80 disabled:opacity-60"
    >
      <Sparkles size={14} />
      {seeding
        ? fa ? "در حال افزودن..." : "Adding..."
        : fa ? "با داده‌ی نمونه امتحان کن" : "Try with sample data"}
    </button>
  );
}
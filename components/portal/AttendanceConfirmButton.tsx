"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { CheckCircle, Circle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { confirmAttendance } from "@/lib/server/portal-actions";

export default function AttendanceConfirmButton({
  sessionId,
  confirmed,
}: {
  sessionId: string;
  confirmed: boolean;
}) {
  const locale = useLocale();
  const fa = locale === "fa";
  const toast = useToast();
  const [done, setDone] = useState(confirmed);
  const [busy, setBusy] = useState(false);

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e0f0e6] px-3 py-1 text-[10px] font-extrabold text-[#2f7a55]">
        <CheckCircle size={12} />
        {fa ? "حضور تأیید شد" : "Attendance confirmed"}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await confirmAttendance(sessionId);
        if (res.ok) {
          toast(fa ? "✅ حضور ثبت شد" : "✅ Confirmed");
          setDone(true);
        } else {
          toast(fa ? "❌ خطا" : "❌ Error");
        }
        setBusy(false);
      }}
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#d94f63] px-3 py-1 text-[10px] font-extrabold text-[#d94f63] transition hover:bg-[#f8d8e0] disabled:opacity-60"
    >
      <Circle size={12} />
      {busy ? "..." : fa ? "تأیید حضور" : "I was here"}
    </button>
  );
}
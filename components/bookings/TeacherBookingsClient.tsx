"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { CalendarCheck } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { getTeacherBookings, setBookingStatus } from "@/lib/server/landing-actions";

type Booking = { id: string; name: string; phone: string; note: string; status: string; createdAt: string };

export default function TeacherBookingsClient() {
  const locale = useLocale();
  const fa = locale === "fa";
  const [list, setList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setList((await getTeacherBookings()) as Booking[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    await setBookingStatus(id, status);
    setList((l) => l.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{fa ? "درخواست‌های رزرو" : "Booking requests"}</h1>
      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-3xl" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          fa={{ title: "درخواستی نداری", hint: "وقتی کسی از لندینگت رزرو کنه اینجا می‌بینی." }}
          en={{ title: "No requests", hint: "Booking requests from your landing appear here." }}
        />
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <div key={b.id} className="card-lux flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-extrabold">{b.name}</p>
                <p className="text-xs text-[var(--c-ink-soft)]" dir="ltr">{b.phone}</p>
                {b.note && <p className="mt-1 text-[11px] text-[var(--c-ink-soft)]">{b.note}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setStatus(b.id, "CONTACTED")} className="chip-lux bg-[#f6e7c6] text-[#b3701f]">تماس گرفتم</button>
                <button onClick={() => setStatus(b.id, "DONE")} className="chip-lux bg-[#e0f0e6] text-[#2f7a55]">انجام شد</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
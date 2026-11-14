"use client";

import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { replyTicket, closeTicket } from "@/lib/server/admin-actions";

type Ticket = {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: string;
  reply: string;
  createdAt: string;
};

export default function AdminTicketsClient({ tickets }: { tickets: Ticket[] }) {
  const toast = useToast();
  const [list, setList] = useState(tickets);
  const [replying, setReplying] = useState<string | null>(null);
  const [text, setText] = useState("");

  const submit = async (id: string) => {
    if (!text.trim()) return;
    const res = await replyTicket(id, text);
    if (res.ok) {
      setList((l) => l.map((t) => (t.id === id ? { ...t, status: "REPLIED", reply: text } : t)));
      setReplying(null);
      setText("");
      toast("✅ پاسخ ثبت شد");
    } else toast("❌");
  };

  const close = async (id: string) => {
    const res = await closeTicket(id);
    if (res.ok) {
      setList((l) => l.map((t) => (t.id === id ? { ...t, status: "CLOSED" } : t)));
      toast("✅ بسته شد");
    }
  };

  const statusChip = (s: string) => {
    if (s === "OPEN") return "bg-[#f6d2ce] text-[#b3261e]";
    if (s === "REPLIED") return "bg-[#f6e7c6] text-[#b3701f]";
    return "bg-[#e0f0e6] text-[#2f7a55]";
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">تیکت‌های پشتیبانی</h1>
      <div className="space-y-3">
        {list.map((t) => (
          <div key={t.id} className="card-lux p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold">{t.subject}</h3>
                <p className="text-xs text-[var(--c-ink-soft)]">
                  {t.userName} • {t.userEmail}
                </p>
              </div>
              <span className={`chip-lux ${statusChip(t.status)}`}>{t.status}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{t.message}</p>
            {t.reply && (
              <div className="mt-3 rounded-2xl bg-[#e0f0e6] p-3">
                <p className="text-[10px] font-extrabold text-[#2f7a55]">پاسخ شما:</p>
                <p className="whitespace-pre-wrap text-sm">{t.reply}</p>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              {replying === t.id ? (
                <>
                  <input
                    className="flex-1 rounded-full border border-[var(--c-primary)]/20 bg-white/50 px-4 py-2 text-sm"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="پاسخ شما..."
                  />
                  <button onClick={() => submit(t.id)} className="btn-primary rounded-full px-4 py-2">
                    <Send size={14} />
                  </button>
                  <button onClick={() => setReplying(null)} className="rounded-full bg-white/40 px-3 py-2">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setReplying(t.id)}
                    className="flex items-center gap-1 rounded-full bg-[var(--c-primary)] px-4 py-2 text-xs font-extrabold text-white"
                  >
                    <MessageCircle size={14} /> پاسخ
                  </button>
                  {t.status !== "CLOSED" && (
                    <button
                      onClick={() => close(t.id)}
                      className="rounded-full bg-white/40 px-4 py-2 text-xs font-extrabold"
                    >
                      بستن تیکت
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
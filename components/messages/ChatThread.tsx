"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Send } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { sendMessage, markThreadRead } from "@/lib/server/portal-actions";

type Msg = { id: string; sender: "TEACHER" | "STUDENT"; text: string; createdAt: string };

export default function ChatThread({
  studentId,
  studentName,
  role,
  initialMessages,
  pollInterval = 10000,
}: {
  studentId: string;
  studentName: string;
  role: "TEACHER" | "STUDENT";
  initialMessages: Msg[];
  pollInterval?: number;
}) {
  const locale = useLocale();
  const fa = locale === "fa";
  const toast = useToast();

  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // اسکرول به پایین
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages]);

  // mark read
  useEffect(() => {
    markThreadRead(studentId).catch(() => {});
  }, [studentId, messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await sendMessage(studentId, text);
    if (res.ok) {
      const now = new Date().toISOString();
      setMessages((m) => [...m, { id: `local-${now}`, sender: role, text, createdAt: now }]);
      setText("");
    } else {
      toast(fa ? "❌ ارسال نشد" : "❌ Failed to send");
    }
    setSending(false);
  };

  return (
    <div className="card-lux flex h-[500px] flex-col overflow-hidden">
      <div className="border-b border-[var(--c-primary)]/10 bg-[var(--c-surface-2)]/50 px-5 py-3">
        <p className="text-sm font-extrabold">{studentName}</p>
      </div>

      <div ref={boxRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-xs text-[var(--c-ink-soft)]">
            {fa ? "هنوز پیامی نیست. اول تو شروع کن!" : "No messages yet. Start the conversation!"}
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender === role;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-gradient-to-br from-[#e8697b] to-[#d94f63] text-white"
                    : "bg-[var(--c-surface-2)] text-[var(--c-ink)]"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`mt-1 text-[9px] ${mine ? "text-white/70" : "text-[var(--c-ink-soft)]"}`}>
                  {new Date(m.createdAt).toLocaleTimeString(locale === "fa" ? "fa-IR" : "en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-[var(--c-primary)]/10 bg-[var(--c-surface-2)]/30 p-3">
        <input
          className="flex-1 rounded-full border border-white/40 bg-white/50 px-4 py-2.5 text-sm font-bold outline-none focus:border-[#D94F63]"
          placeholder={fa ? "پیامت رو بنویس..." : "Type your message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-60"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
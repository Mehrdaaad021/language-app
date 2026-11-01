"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { MessageCircle } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { useAppData } from "@/lib/store";
import ChatThread from "@/components/messages/ChatThread";
import { getTeacherThreads, getThreadMessages } from "@/lib/server/portal-actions";

type Thread = { studentId: string; studentName: string; lastText: string; lastAt: string | null; unread: number };

export default function MessagesTeacherClient() {
  const locale = useLocale();
  const fa = locale === "fa";
  const { data } = useAppData();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const students = data?.students ?? [];

  const loadThreads = async () => {
    const rows = (await getTeacherThreads()) as Thread[];
    setThreads(rows);
    setLoading(false);
  };

  const loadMessages = async (studentId: string) => {
    const rows = await getThreadMessages(studentId);
    setMessages(rows);
  };

  useEffect(() => {
    loadThreads();
  }, [students.length]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId]);

  const activeThread = threads.find((t) => t.studentId === activeId);
  const activeName = activeThread?.studentName ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">{fa ? "پیام‌ها" : "Messages"}</h1>
        <p className="mt-1 text-sm text-[var(--c-ink-soft)]">
          {fa ? "گفت‌وگو با شاگردها" : "Chat with students"}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          <div className="skeleton h-96 rounded-3xl" />
          <div className="skeleton h-96 rounded-3xl" />
        </div>
      ) : threads.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          fa={{ title: "هنوز شاگردی نداری", hint: "بعد از اضافه کردن شاگرد، اینجا می‌تونی چت کنی." }}
          en={{ title: "No students yet", hint: "Add a student to start chatting." }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          {/* لیست thread ها */}
          <div className="card-lux max-h-[500px] overflow-y-auto p-3">
            {threads.map((t) => (
              <button
                key={t.studentId}
                type="button"
                onClick={() => setActiveId(t.studentId)}
                className={`mb-1 flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition ${
                  activeId === t.studentId ? "bg-[var(--c-primary)]/10" : "hover:bg-[var(--c-surface-2)]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{t.studentName}</p>
                  {t.lastText && (
                    <p className="truncate text-[11px] text-[var(--c-ink-soft)]">{t.lastText}</p>
                  )}
                </div>
                {t.unread > 0 && (
                  <span className="ms-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d94f63] px-1.5 text-[10px] font-extrabold text-white">
                    {t.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* چت فعال */}
          {activeId ? (
            <ChatThread
              key={activeId}
              studentId={activeId}
              studentName={activeName}
              role="TEACHER"
              initialMessages={messages}
            />
          ) : (
            <div className="card-lux flex h-[500px] items-center justify-center p-6">
              <p className="text-sm text-[var(--c-ink-soft)]">
                {fa ? "← یک شاگرد رو انتخاب کن" : "← Select a student"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
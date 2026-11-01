"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import ChatThread from "@/components/messages/ChatThread";
import { getMyPortalExtras } from "@/lib/server/portal-actions";

export default function StudentMessagesClient({
  studentId,
  teacherName,
}: {
  studentId: string;
  teacherName: string;
}) {
  const locale = useLocale();
  const fa = locale === "fa";
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getMyPortalExtras();
      setMessages(data.messages);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">{fa ? "گفت‌وگو با معلم" : "Chat with teacher"}</h1>
        <p className="mt-1 text-sm text-[var(--c-ink-soft)]">{teacherName}</p>
      </div>
      <ChatThread studentId={studentId} studentName={teacherName} role="STUDENT" initialMessages={messages} />
    </div>
  );
}
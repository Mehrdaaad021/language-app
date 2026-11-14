"use client";

import { useState } from "react";
import { Ban, CheckCircle, Crown } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { setUserSuspended, promoteToAdmin } from "@/lib/server/admin-actions";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  platformRole: string;
  suspended: boolean;
  workspaceCount: number;
};

export default function AdminUsersClient({ users }: { users: User[] }) {
  const toast = useToast();
  const [list, setList] = useState(users);

  const toggleSuspend = async (id: string, suspended: boolean) => {
    const res = await setUserSuspended(id, suspended);
    if (res.ok) {
      setList((l) => l.map((u) => (u.id === id ? { ...u, suspended } : u)));
      toast("✅");
    } else toast("❌");
  };

  const promote = async (id: string) => {
    const res = await promoteToAdmin(id);
    if (res.ok) {
      setList((l) => l.map((u) => (u.id === id ? { ...u, platformRole: "ADMIN" } : u)));
      toast("✅ ارتقا به ادمین");
    } else toast("❌");
  };

  const toFa = (s: string | number) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">کاربران پلتفرم</h1>
      <div className="card-lux overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--c-surface-2)]/50 text-xs">
            <tr>
              <th className="px-4 py-3 text-start font-extrabold">نام</th>
              <th className="px-4 py-3 text-start font-extrabold">ایمیل</th>
              <th className="px-4 py-3 text-center font-extrabold">نقش پلتفرم</th>
              <th className="px-4 py-3 text-center font-extrabold">Workspace</th>
              <th className="px-4 py-3 text-center font-extrabold">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--c-primary)]/10">
            {list.map((u) => (
              <tr key={u.id} className="hover:bg-[var(--c-surface-2)]/30">
                <td className="px-4 py-3 font-bold">
                  {u.name}
                  {u.suspended && (
                    <span className="ms-2 chip-lux bg-[#f6d2ce] text-[#b3261e]">معلق</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--c-ink-soft)]">{u.email}</td>
                <td className="px-4 py-3 text-center">
                  {u.platformRole === "ADMIN" ? (
                    <span className="chip-lux bg-[#e5dff2] text-[#7a5ba6]">
                      <Crown size={10} /> ادمین
                    </span>
                  ) : (
                    <span className="chip-lux bg-[#f6e7c6] text-[#b3701f]">کاربر</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center tabular-nums">{toFa(u.workspaceCount)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    {u.platformRole !== "ADMIN" && (
                      <button
                        onClick={() => promote(u.id)}
                        className="rounded-lg bg-[#e5dff2] p-1.5 text-[#7a5ba6] hover:brightness-95"
                        title="ارتقا به ادمین"
                      >
                        <Crown size={14} />
                      </button>
                    )}
                    {!u.suspended ? (
                      <button
                        onClick={() => toggleSuspend(u.id, true)}
                        className="rounded-lg bg-[#f6d2ce] p-1.5 text-[#b3261e] hover:brightness-95"
                        title="تعلیق"
                      >
                        <Ban size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleSuspend(u.id, false)}
                        className="rounded-lg bg-[#e0f0e6] p-1.5 text-[#2f7a55] hover:brightness-95"
                        title="لغو تعلیق"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
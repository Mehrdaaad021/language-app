"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, RefreshCw, Trash2, Copy, Shield, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { TextField } from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { logoutAction } from "@/lib/server/auth-actions";
import { listTeachers, createTeacher, resetTeacherPassword, deleteTeacher } from "@/lib/server/admin-actions";

type Teacher = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  twoFactorEnabled: boolean;
};

export default function AdminPage() {
  const t = useTranslations("Admin");
  const ta = useTranslations("Auth");
  const toast = useToast();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listTeachers();
      setTeachers(list);
    } catch {
      toast(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleLogout = async () => {
    await logoutAction();
    router.replace("/login");
    router.refresh();
  };

  const handleCreate = async () => {
    const res = await createTeacher(newEmail, newName);
    if ("error" in res) {
      toast(res.error);
      return;
    }
    setGeneratedPassword(res.password);
    setNewEmail("");
    setNewName("");
    load();
  };

  const handleReset = async (id: string) => {
    const res = await resetTeacherPassword(id);
    if ("error" in res) {
      toast(res.error);
      return;
    }
    setResetPassword(res.password);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    const res = await deleteTeacher(id);
    if ("error" in res) {
      toast(res.error);
      return;
    }
    toast(t("teacherDeleted"));
    load();
  };

  const copyPassword = async (password: string) => {
    await navigator.clipboard.writeText(password);
    toast(t("passwordCopied"));
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white shadow-lg">
              <Shield size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold md:text-3xl">{t("title")}</h1>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{t("subtitle")}</p>
            </div>
          </div>
          <Button variant="glass" icon={<LogOut size={15} />} onClick={handleLogout}>
            {ta("logout")}
          </Button>
        </motion.div>

        <Card>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{t("teachers")}</h2>
            <Button icon={<UserPlus size={16} />} onClick={() => setCreateOpen(true)}>
              {t("createTeacher")}
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/30" />
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-ink-soft)]">{t("noTeachers")}</p>
          ) : (
            <div className="space-y-3">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/25 p-4 transition hover:bg-white/35"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{teacher.name || "—"}</p>
                    <p className="truncate text-xs text-[var(--color-ink-soft)]">{teacher.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {teacher.twoFactorEnabled && <Badge tone="success">{t("2faEnabled")}</Badge>}
                    <Button variant="glass" icon={<RefreshCw size={14} />} onClick={() => handleReset(teacher.id)}>
                      {t("resetPassword")}
                    </Button>
                    <Button
                      variant="ghost"
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDelete(teacher.id)}
                      aria-label={t("deleteTeacher")}
                    >
                      {""}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setGeneratedPassword(null); }}
        title={t("createTeacher")}
      >
        {generatedPassword ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-ink-soft)]">{t("teacherCreated")}</p>
            <div className="rounded-2xl bg-[rgba(217,79,99,0.1)] p-4">
              <p className="mb-2 text-xs font-bold text-[#B23A4C]">{t("generatedPassword")}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-white/50 px-3 py-2 font-mono text-sm">
                  {generatedPassword}
                </code>
                <Button icon={<Copy size={14} />} onClick={() => copyPassword(generatedPassword)} aria-label={t("copyPassword")}>
                  {""}
                </Button>
              </div>
            </div>
            <p className="text-xs text-[var(--color-ink-soft)]">{t("passwordHint")}</p>
            <Button onClick={() => { setCreateOpen(false); setGeneratedPassword(null); }} className="w-full">
              {t("done")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <TextField label={t("email")} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <TextField label={t("name")} value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)} className="flex-1">
                {t("cancel")}
              </Button>
              <Button onClick={handleCreate} className="flex-1">
                {t("create")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!resetPassword} onClose={() => setResetPassword(null)} title={t("passwordReset")}>
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-ink-soft)]">{t("passwordResetHint")}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white/50 px-3 py-2 font-mono text-sm">{resetPassword}</code>
            <Button icon={<Copy size={14} />} onClick={() => copyPassword(resetPassword!)} aria-label={t("copyPassword")}>
              {""}
            </Button>
          </div>
          <Button onClick={() => setResetPassword(null)} className="w-full">
            {t("done")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
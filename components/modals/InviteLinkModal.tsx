"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, Link2, Unlink } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { generateInviteLink, revokeInviteLink, getStudentInviteToken } from "@/lib/server/invite-actions";

export default function InviteLinkModal({
  open,
  onClose,
  studentId,
  studentName,
}: {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}) {
  const t = useTranslations("Invite");
  const toast = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // وقتی modal باز می‌شه، توکن فعلی رو از سرور بگیر
  useEffect(() => {
    if (open) {
      getStudentInviteToken(studentId).then(setToken).catch(() => setToken(null));
    }
  }, [open, studentId]);

  const url = typeof window !== "undefined" && token
    ? `${window.location.origin}/invite/${token}`
    : null;

  const generate = async () => {
    setLoading(true);
    const res = await generateInviteLink(studentId);
    setLoading(false);
    if ("error" in res) {
      toast(t("generateError"));
      return;
    }
    setToken(res.token);
    toast(t("linkGenerated"));
  };

  const revoke = async () => {
    await revokeInviteLink(studentId);
    setToken(null);
    toast(t("linkRevoked"));
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast(t("linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} title={t("inviteTitle", { name: studentName })}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-white/25 px-4 py-3 text-xs font-bold text-[var(--color-ink-soft)]">
          <Link2 size={14} />
          {t("inviteHint")}
        </div>

        {url ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white/30 p-3 font-mono text-xs break-all">
              <span className="flex-1 text-[var(--color-ink)]">{url}</span>
              <button
                onClick={copy}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/50 text-[var(--color-ink-soft)] transition hover:bg-white/70"
              >
                {copied ? <Check size={15} className="text-[#2F6B4F]" /> : <Copy size={15} />}
              </button>
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="ghost" icon={<Unlink size={14} />} onClick={revoke}>
                {t("revoke")}
              </Button>
              <Button onClick={generate}>
                {t("regenerate")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-center text-xs text-[var(--color-ink-soft)]">{t("noLinkYet")}</p>
            <Button onClick={generate} icon={<Link2 size={15} />}>
              {loading ? t("generating") : t("generate")}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
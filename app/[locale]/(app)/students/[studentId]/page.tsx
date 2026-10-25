"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams, notFound } from "next/navigation";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { ArrowRight, FileDown, Link2, UserPlus, Copy, X, FileText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import { generateInviteLink, getStudentInviteToken, revokeInviteLink } from "@/lib/server/invite-actions";
import { createStudentAccount } from "@/lib/server/auth-actions";
import ReportDocument from "@/components/report/ReportDocument";

const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/40 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

function fmtNum(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
  } catch {
    return String(n);
  }
}

type Attachment = { id: string; name: string; kind: "image" | "file"; url: string };

export default function StudentProfilePage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params?.studentId ?? "";
  const locale = useLocale();
  const t = useTranslations("Profile");
  const tr = useTranslations("Report");
  const tp = useTranslations("Pages");
  const ti = useTranslations("Invite");
  const ts = useTranslations("Student");
  const toast = useToast();
  const { data, loading } = useAppData();

  const students = data?.students ?? [];
  const sessions = data?.sessions ?? [];
  const payments = data?.payments ?? [];
  const notes = data?.notes ?? [];

  const [inviteOpen, setInviteOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const student = students.find((s) => s.id === studentId);

  useEffect(() => {
    if (!inviteOpen || !studentId) return;
    let alive = true;
    getStudentInviteToken(studentId)
      .then((tk) => {
        if (alive) setToken(tk);
      })
      .catch(() => {
        if (alive) setToken(null);
      });
    return () => {
      alive = false;
    };
  }, [inviteOpen, studentId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-white/25" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/25" />
      </div>
    );
  }

  if (!student) notFound();

  const mySessions = sessions.filter((s) => s.studentName === student.name);
  const myPayments = payments.filter((p) => p.studentName === student.name);
  const myNotes = notes.filter((n) => n.studentId === student.id);
  const totalPaid = myPayments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const fmt = (n: number) => fmtNum(n, locale);

  const inviteUrl = token ? `${window.location.origin}/${locale}/invite/${token}` : null;

  /* ── کارنامه‌ی PDF ── */
  const openReport = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const png = await toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const img = new Image();
      img.src = png;
      await img.decode();
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (img.height / img.width) * pageW;
      const pages = Math.max(1, Math.ceil(imgH / pageH));
      for (let i = 0; i < pages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(png, "PNG", 0, -i * pageH, pageW, imgH);
      }
      pdf.save(`report-${student.name}.pdf`);
      toast(tr("reportReady"));
    } catch {
      toast(tr("reportReady") === "" ? "⚠️" : "⚠️");
    } finally {
      setGenerating(false);
    }
  };

  /* ── لینک دعوت ── */
  const handleGenerate = async () => {
    setInviteBusy(true);
    try {
      const res = await generateInviteLink(studentId);
      if ("error" in res) {
        toast(ti("generateError"));
      } else {
        setToken(res.token);
        toast(ti("linkGenerated"));
      }
    } catch {
      toast(ti("generateError"));
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRevoke = async () => {
    setInviteBusy(true);
    try {
      await revokeInviteLink(studentId);
      setToken(null);
      toast(ti("linkRevoked"));
    } catch {
      toast(ti("generateError"));
    } finally {
      setInviteBusy(false);
    }
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast(ti("linkCopied"));
  };

  /* ── ساخت حساب شاگرد ── */
  const handleAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountBusy(true);
    try {
      const res = await createStudentAccount({ studentId, email, password });
      if (!res.ok) {
        toast(
          ts(
            `errors.${
              res.error === "emailTaken" ? "emailTaken" : res.error === "alreadyLinked" ? "alreadyLinked" : "invalid"
            }`
          )
        );
      } else {
        toast(ts("accountCreated"));
        setAccountOpen(false);
        setEmail("");
        setPassword("");
      }
    } catch {
      toast(ts("errors.forbidden"));
    } finally {
      setAccountBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/students"
        className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)]"
      >
        <ArrowRight size={14} className={locale === "fa" ? "" : "rotate-180"} />
        {t("back")}
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold md:text-3xl">{student.name}</h1>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              {student.level} — {tp("term")}: {student.term}
              {student.phone ? ` — ${student.phone}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openReport}
              disabled={generating}
              className="flex items-center gap-2 rounded-full bg-white/30 px-4 py-2 text-xs font-extrabold transition hover:bg-white/40 disabled:opacity-60"
            >
              <FileDown size={14} />
              {generating ? "…" : t("download")}
            </button>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 rounded-full bg-white/30 px-4 py-2 text-xs font-extrabold transition hover:bg-white/40"
            >
              <Link2 size={14} />
              {t("inviteLink")}
            </button>
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] px-4 py-2 text-xs font-extrabold text-white shadow-lg transition hover:brightness-105"
            >
              <UserPlus size={14} />
              {t("createAccount")}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white/25 p-4">
            <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("totalPaid")}</p>
            <p className="mt-1 text-xl font-extrabold">{fmt(totalPaid)}</p>
          </div>
          <div className="rounded-xl bg-white/25 p-4">
            <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("sessionsCount")}</p>
            <p className="mt-1 text-xl font-extrabold">{fmt(mySessions.length)}</p>
          </div>
          <div className="rounded-xl bg-white/25 p-4">
            <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("notesCount")}</p>
            <p className="mt-1 text-xl font-extrabold">{fmt(myNotes.length)}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-extrabold">{t("sessions")}</h2>
          {mySessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-ink-soft)]">—</p>
          ) : (
            <div className="space-y-2">
              {mySessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-white/25 p-3">
                  <div>
                    <p className="text-sm font-bold">{s.topic}</p>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      {s.date} — {s.time}
                    </p>
                  </div>
                  <Badge tone={s.status === "upcoming" ? "info" : s.status === "completed" ? "success" : "warn"}>
                    {tp(s.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-extrabold">{t("payments")}</h2>
          {myPayments.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-ink-soft)]">—</p>
          ) : (
            <div className="space-y-2">
              {myPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/25 p-3">
                  <p className="text-sm font-bold">
                    {fmt(p.amount)} {tp("toman")}
                  </p>
                  <Badge tone={p.status === "paid" ? "success" : "warn"}>{tp(p.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-extrabold">{t("notebook")}</h2>
        {myNotes.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--color-ink-soft)]">{t("emptyNotebook")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {myNotes.map((n) => (
              <div key={n.id} className="rounded-xl bg-white/25 p-4">
                <p className="font-extrabold">{n.title}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{n.date}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-[var(--color-ink-soft)]">
                  {n.content.slice(0, 180)}
                  {n.content.length > 180 && "…"}
                </p>
                {(n.attachments ?? []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(n.attachments as Attachment[]).map((a) =>
                      a.kind === "image" ? (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-lg ring-1 ring-white/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.url} alt={a.name} className="h-16 w-16 object-cover" />
                        </a>
                      ) : (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-lg bg-white/30 px-2.5 py-1.5 text-[10px] font-extrabold transition hover:bg-white/40"
                        >
                          <FileText size={12} />
                          {a.name}
                        </a>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* مودال لینک دعوت */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onMouseDown={() => setInviteOpen(false)}
        >
          <div className="glass-strong w-full max-w-md rounded-[24px] p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{ti("inviteTitle", { name: student.name })}</h2>
              <button type="button" onClick={() => setInviteOpen(false)} className="rounded-lg p-1 transition hover:bg-white/30">
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-xs text-[var(--color-ink-soft)]">{ti("inviteHint")}</p>
            {inviteUrl ? (
              <div className="space-y-3">
                <code className="block break-all rounded-lg bg-white/40 px-3 py-2 font-mono text-xs">{inviteUrl}</code>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/30 py-2.5 text-xs font-extrabold transition hover:bg-white/40"
                  >
                    <Copy size={14} />
                    {ti("linkCopied")}
                  </button>
                  <button
                    type="button"
                    onClick={handleRevoke}
                    disabled={inviteBusy}
                    className="flex-1 rounded-full bg-[rgba(217,79,99,0.15)] py-2.5 text-xs font-extrabold text-[#B23A4C] transition hover:bg-[rgba(217,79,99,0.25)] disabled:opacity-60"
                  >
                    {ti("revoke")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={inviteBusy}
                className="w-full rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:brightness-105 disabled:opacity-60"
              >
                {inviteBusy ? ti("generating") : ti("generate")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* مودال ساخت حساب شاگرد */}
      {accountOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onMouseDown={() => setAccountOpen(false)}
        >
          <div className="glass-strong w-full max-w-md rounded-[24px] p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{ts("accountTitle", { name: student.name })}</h2>
              <button type="button" onClick={() => setAccountOpen(false)} className="rounded-lg p-1 transition hover:bg-white/30">
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-xs text-[var(--color-ink-soft)]">{ts("accountHint")}</p>
            <form onSubmit={handleAccount} className="flex flex-col gap-4" noValidate>
              <div>
                <label className="mb-1 block text-xs font-extrabold">{ts("email")}</label>
                <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-extrabold">{ts("password")}</label>
                <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button
                type="submit"
                disabled={accountBusy}
                className="rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:brightness-105 disabled:opacity-60"
              >
                {accountBusy ? "…" : ts("createAccount")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* سند مخفی کارنامه برای capture */}
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
        <ReportDocument
          ref={reportRef}
          data={{
            student: {
              name: student.name,
              level: student.level,
              term: student.term,
              phone: student.phone ?? "",
            },
            sessions: mySessions,
            payments: myPayments,
            notes: myNotes,
          }}
        />
      </div>
    </div>
  );
}
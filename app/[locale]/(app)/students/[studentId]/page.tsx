"use client";

import { use, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { ArrowRight, Phone, CalendarDays, Wallet, NotebookPen, KeyRound, FileDown, Link2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import Notebook from "@/components/ui/Notebook";
import NewNoteModal from "@/components/modals/NewNoteModal";
import CreateAccountModal from "@/components/modals/CreateAccountModal";
import InviteLinkModal from "@/components/modals/InviteLinkModal";
import { useAppData } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { formatNumber, formatDate, formatTime, formatWeekday } from "@/lib/format";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ReportCard from "@/components/report/ReportCard";

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ locale: string; studentId: string }>;
}) {
  const { studentId } = use(params);
  const t = useTranslations("Profile");
  const tp = useTranslations("Pages");
  const tr = useTranslations("Report");
  const locale = useLocale();
  const toast = useToast();
  const { students, sessions, payments, notes } = useAppData();
  const [noteOpen, setNoteOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  

 
  const reportRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const student = students.find((s) => s.id === studentId);
  if (!student) notFound();

  const mySessions = sessions.filter((s) => s.studentName === student.name);
  const myPayments = payments.filter((p) => p.studentName === student.name);
  const myNotes = notes.filter((n) => n.studentId === student.id);
  const totalPaid = myPayments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);

  const downloadReport = async () => {
    const node = reportRef.current;
    if (!node || generating) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#FFFDF7", useCORS: true });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297;
      const data = canvas.toDataURL("image/png");
      let heightLeft = imgHeight;
      let position = 10;
      pdf.addImage(data, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(data, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }
      pdf.save(`report-${student.name}.pdf`);
      toast(tr("reportReady"));
    } finally {
      setGenerating(false);
    }
  };

  const STATS = [
    { icon: CalendarDays, value: formatNumber(mySessions.length, locale), label: t("sessionsCount"), tint: "bg-[rgba(214,142,60,0.16)] text-[#8A5A22]" },
    { icon: Wallet, value: formatNumber(totalPaid, locale), label: t("totalPaid"), tint: "bg-[rgba(122,178,146,0.20)] text-[#2F6B4F]" },
    { icon: NotebookPen, value: formatNumber(myNotes.length, locale), label: t("notesCount"), tint: "bg-[rgba(217,79,99,0.12)] text-[#B23A4C]" },
  ];

  return (
    <Stagger>
      <StaggerItem>
        <Link
          href="/students"
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)]"
        >
          <ArrowRight size={15} className="icon-flip" />
          {t("back")}
        </Link>
      </StaggerItem>

      <StaggerItem>
        <Card strong className="mb-6 flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFCED8] to-[#FFDDDD] text-3xl font-extrabold text-[#8A4A56] shadow-inner">
            {student.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold">{student.name}</h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--color-ink-soft)]">
              <Phone size={12} />
              {student.phone}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{tp("term")}: {student.term}</p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Button variant="glass" icon={<FileDown size={15} />} onClick={downloadReport}>
              {tr("download")}
            </Button>
            {!student.hasAccount && (
              <>
                <Button variant="glass" icon={<Link2 size={15} />} onClick={() => setInviteOpen(true)}>
                  {t("inviteLink")}
                </Button>
                <Button variant="glass" icon={<KeyRound size={15} />} onClick={() => setAccountOpen(true)}>
                  {t("createAccount")}
                </Button>
              </>
            )}
            <Badge tone="info">{student.level}</Badge>
            <Badge tone={student.active ? "success" : "danger"}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {student.active ? tp("active") : tp("inactive")}
            </Badge>
          </div>
        </Card>
      </StaggerItem>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STATS.map((s) => (
          <StaggerItem key={s.label}>
            <Card hoverable>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${s.tint}`}>
                <s.icon size={20} />
              </div>
              <p className="mt-4 text-2xl font-extrabold tracking-tight">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-[var(--color-ink-soft)]">{s.label}</p>
            </Card>
          </StaggerItem>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <StaggerItem>
          <Card>
            <h2 className="mb-4 text-lg font-extrabold">{t("sessions")}</h2>
            <ul className="flex flex-col gap-3">
              {mySessions.map((se) => (
                <li key={se.id} className="flex items-center gap-4 rounded-2xl bg-white/25 px-4 py-3">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE8C4] to-[#FFF4DE] shadow-inner">
                    <span className="text-[9px] font-bold text-[var(--color-ink-soft)]">{formatWeekday(se.date, locale)}</span>
                    <span className="text-[11px] font-extrabold">{formatTime(se.time, locale)}</span>
                  </div>
                  <p className="flex-1 truncate text-sm font-bold">{se.topic}</p>
                  <Badge tone={se.status === "upcoming" ? "info" : se.status === "completed" ? "success" : "danger"}>
                    {se.status === "upcoming" ? tp("upcoming") : se.status === "completed" ? tp("completed") : tp("cancelled")}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <h2 className="mb-4 text-lg font-extrabold">{t("payments")}</h2>
            <ul className="divide-y divide-white/40">
              {myPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3.5 text-sm">
                  <span className="text-xs text-[var(--color-ink-soft)]">{formatDate(p.date, locale)}</span>
                  <span className="font-semibold text-[var(--color-ink-soft)]">{formatNumber(p.amount, locale)}</span>
                  <Badge tone={p.status === "paid" ? "success" : "warn"}>
                    {p.status === "paid" ? tp("paid") : tp("pending")}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </StaggerItem>
      </div>

      <StaggerItem className="mt-8">
        <Notebook notes={myNotes} onNew={() => setNoteOpen(true)} />
      </StaggerItem>

      <NewNoteModal open={noteOpen} onClose={() => setNoteOpen(false)} studentId={student.id} />
      <InviteLinkModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        studentId={student.id}
        studentName={student.name}
      />
      <div className="pointer-events-none fixed -left-[3000px] top-0" aria-hidden="true">
        <div ref={reportRef}>
          <ReportCard student={student} sessions={mySessions} payments={myPayments} notes={myNotes} />
        </div>
      </div>
    </Stagger>
  );
}
"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Note, Payment, Session, Student } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";

const INK = "#3A2A2E";
const SOFT = "#8A7076";
const LINE = "#E7D8C6";
const ROSE = "#D94F63";
const CREAM = "#FFF7EA";

export default function ReportCard({
  student,
  sessions,
  payments,
  notes,
}: {
  student: Student;
  sessions: Session[];
  payments: Payment[];
  notes: Note[];
}) {
  const t = useTranslations("Report");
  const locale = useLocale();

  const held = sessions.filter((s) => s.status === "completed").length;
  const upcoming = sessions.filter((s) => s.status === "upcoming").length;
  const paid = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const pending = payments.filter((p) => p.status !== "paid").reduce((a, p) => a + p.amount, 0);
  const today = new Date().toISOString().slice(0, 10);

  const statusLabel = (s: Session["status"]) =>
    s === "upcoming" ? t("upcoming") : s === "completed" ? t("completed") : t("cancelled");
  const payLabel = (p: Payment["status"]) => (p === "paid" ? t("paid") : t("pendingStatus"));

  const th: React.CSSProperties = {
    textAlign: locale === "fa" ? "right" : "left",
    padding: "8px 10px",
    fontSize: 11,
    color: SOFT,
    borderBottom: `1px solid ${LINE}`,
  };
  const td: React.CSSProperties = { padding: "8px 10px", fontSize: 12, borderBottom: `1px solid ${LINE}`, color: INK };

  return (
    <div
      dir={locale === "fa" ? "rtl" : "ltr"}
      style={{
        width: 794,
        padding: 48,
        backgroundColor: "#FFFDF7",
        color: INK,
        fontFamily: locale === "fa" ? "Vazirmatn, Tahoma, sans-serif" : "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: ROSE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            📚
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800 }}>{t("brand")}</p>
            <p style={{ fontSize: 11, color: SOFT }}>{t("title")}</p>
          </div>
        </div>
        <p style={{ fontSize: 11, color: SOFT }}>
          {t("generatedAt")}: {formatDate(today, locale, { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div style={{ marginTop: 28, borderRadius: 16, border: `1px solid ${LINE}`, background: CREAM, padding: 20 }}>
        <p style={{ fontSize: 20, fontWeight: 800 }}>{student.name}</p>
        <div style={{ marginTop: 10, display: "flex", gap: 24, fontSize: 12, color: SOFT }}>
          <span>{t("level")}: <b style={{ color: INK }}>{student.level}</b></span>
          <span>{t("term")}: <b style={{ color: INK }}>{student.term}</b></span>
          <span>{t("phone")}: <b style={{ color: INK }}>{student.phone || t("empty")}</b></span>
        </div>
      </div>

      <p style={{ marginTop: 28, fontSize: 13, fontWeight: 800 }}>{t("summary")}</p>
      <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
        {[
          { label: t("sessionsHeld"), value: formatNumber(held, locale) },
          { label: t("sessionsUpcoming"), value: formatNumber(upcoming, locale) },
          { label: t("totalPaid"), value: `${formatNumber(paid, locale)} ${t("toman")}` },
          { label: t("pending"), value: `${formatNumber(pending, locale)} ${t("toman")}` },
        ].map((b) => (
          <div key={b.label} style={{ flex: 1, borderRadius: 12, border: `1px solid ${LINE}`, padding: 12, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 800 }}>{b.value}</p>
            <p style={{ fontSize: 10, color: SOFT, marginTop: 4 }}>{b.label}</p>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 28, fontSize: 13, fontWeight: 800 }}>{t("sessionsTable")}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
        <thead>
          <tr>
            <th style={th}>{t("date")}</th>
            <th style={th}>{t("topic")}</th>
            <th style={th}>{t("status")}</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 && (
            <tr><td style={td} colSpan={3}>{t("empty")}</td></tr>
          )}
          {sessions.map((s) => (
            <tr key={s.id}>
              <td style={td}>{formatDate(s.date, locale)} · {s.time}</td>
              <td style={td}>{s.topic}</td>
              <td style={td}>{statusLabel(s.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 24, fontSize: 13, fontWeight: 800 }}>{t("paymentsTable")}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
        <thead>
          <tr>
            <th style={th}>{t("date")}</th>
            <th style={th}>{t("amount")}</th>
            <th style={th}>{t("status")}</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 && (
            <tr><td style={td} colSpan={3}>{t("empty")}</td></tr>
          )}
          {payments.map((p) => (
            <tr key={p.id}>
              <td style={td}>{formatDate(p.date, locale)}</td>
              <td style={td}>{formatNumber(p.amount, locale)} {t("toman")}</td>
              <td style={td}>{payLabel(p.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 24, fontSize: 13, fontWeight: 800 }}>{t("notesSection")}</p>
      <ul style={{ marginTop: 8, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {notes.length === 0 && <li style={{ fontSize: 12, color: SOFT }}>{t("empty")}</li>}
        {notes.map((n) => (
          <li key={n.id} style={{ fontSize: 12, color: INK }}>• {n.title} — {formatDate(n.date, locale)}</li>
        ))}
      </ul>

      <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <p style={{ fontSize: 11, color: SOFT }}>{t("brand")}</p>
        <div style={{ width: 160, borderTop: `1px dashed ${SOFT}`, paddingTop: 6, fontSize: 11, color: SOFT, textAlign: "center" }}>
          {t("signature")}
        </div>
      </div>
    </div>
  );
}
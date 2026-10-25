"use client";

import { forwardRef } from "react";
import { useTranslations, useLocale } from "next-intl";

export type ReportData = {
  student: { name: string; level: string; term: string; phone: string };
  sessions: { id: string; date: string; topic: string; status: string }[];
  payments: { id: string; date: string; amount: number; status: string }[];
  notes: { id: string; title: string; date: string }[];
};

function fmtNum(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
  } catch {
    return String(n);
  }
}

const th: React.CSSProperties = { border: "1px solid #d8d8de", padding: "8px 10px", fontSize: 11, fontWeight: 800, background: "#f4f4f7", textAlign: "start" };
const td: React.CSSProperties = { border: "1px solid #d8d8de", padding: "8px 10px", fontSize: 11, textAlign: "start" };

const ReportDocument = forwardRef<HTMLDivElement, { data: ReportData }>(function ReportDocument({ data }, ref) {
  const t = useTranslations("Report");
  const locale = useLocale();
  const dir = locale === "fa" ? "rtl" : "ltr";
  const fmt = (n: number) => fmtNum(n, locale);

  const paid = data.payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const pending = data.payments.filter((p) => p.status !== "paid").reduce((a, p) => a + p.amount, 0);
  const held = data.sessions.filter((s) => s.status === "completed").length;
  const upcoming = data.sessions.filter((s) => s.status === "upcoming").length;

  return (
    <div
      ref={ref}
      dir={dir}
      style={{ width: 794, background: "#ffffff", color: "#17181c", padding: 48, fontFamily: "inherit", lineHeight: 1.7 }}
    >
      {/* سربرگ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #D94F63", paddingBottom: 16 }}>
        <div>
          <p style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>{t("brand")}</p>
          <p style={{ fontSize: 12, color: "#666", margin: "4px 0 0" }}>{t("title")}</p>
        </div>
        <p style={{ fontSize: 11, color: "#666", margin: 0 }}>
          {t("generatedAt")}: {new Date().toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US")}
        </p>
      </div>

      {/* مشخصات شاگرد */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
        <p style={{ margin: 0 }}><b>{t("level") }:</b> {data.student.name}</p>
        <p style={{ margin: 0 }}><b>{t("level")}:</b> {data.student.level}</p>
        <p style={{ margin: 0 }}><b>{t("term")}:</b> {data.student.term}</p>
        <p style={{ margin: 0 }}><b>{t("phone")}:</b> {data.student.phone || "—"}</p>
      </div>

      {/* خلاصه */}
      <h3 style={{ fontSize: 13, fontWeight: 900, margin: "24px 0 8px" }}>{t("summary")}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {[
          { label: t("sessionsHeld"), value: fmt(held) },
          { label: t("sessionsUpcoming"), value: fmt(upcoming) },
          { label: t("totalPaid"), value: fmt(paid) },
          { label: t("pending"), value: fmt(pending) },
        ].map((s) => (
          <div key={s.label} style={{ border: "1px solid #e2e2e8", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{s.value}</p>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "#666" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* جدول جلسات */}
      <h3 style={{ fontSize: 13, fontWeight: 900, margin: "24px 0 8px" }}>{t("sessionsTable")}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>{t("date")}</th>
            <th style={th}>{t("topic")}</th>
            <th style={th}>{t("status")}</th>
          </tr>
        </thead>
        <tbody>
          {data.sessions.length === 0 ? (
            <tr><td style={td} colSpan={3}>{t("empty")}</td></tr>
          ) : (
            data.sessions.map((s) => (
              <tr key={s.id}>
                <td style={td}>{s.date}</td>
                <td style={td}>{s.topic}</td>
                <td style={td}>{t(s.status === "upcoming" ? "upcoming" : s.status === "completed" ? "completed" : "cancelled")}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* جدول پرداخت‌ها */}
      <h3 style={{ fontSize: 13, fontWeight: 900, margin: "24px 0 8px" }}>{t("paymentsTable")}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>{t("date")}</th>
            <th style={th}>{t("amount")}</th>
            <th style={th}>{t("status")}</th>
          </tr>
        </thead>
        <tbody>
          {data.payments.length === 0 ? (
            <tr><td style={td} colSpan={3}>{t("empty")}</td></tr>
          ) : (
            data.payments.map((p) => (
              <tr key={p.id}>
                <td style={td}>{p.date}</td>
                <td style={td}>{fmt(p.amount)} {t("toman")}</td>
                <td style={td}>{t(p.status === "paid" ? "paid" : "pendingStatus")}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* یادداشت‌ها */}
      <h3 style={{ fontSize: 13, fontWeight: 900, margin: "24px 0 8px" }}>{t("notesSection")}</h3>
      {data.notes.length === 0 ? (
        <p style={{ fontSize: 11, color: "#666", margin: 0 }}>{t("empty")}</p>
      ) : (
        <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 11 }}>
          {data.notes.map((n) => (
            <li key={n.id}>{n.title} — {n.date}</li>
          ))}
        </ul>
      )}

      {/* امضا */}
      <div style={{ marginTop: 48, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 180, borderBottom: "1px solid #999", marginBottom: 6 }} />
          <p style={{ margin: 0, fontSize: 10, color: "#666" }}>{t("signature")}</p>
        </div>
      </div>
    </div>
  );
});

export default ReportDocument;
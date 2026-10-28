import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "Language Class <onboarding@resend.dev>";

type Result = { ok: true } | { ok: false; error: string };

async function send(to: string, subject: string, html: string): Promise<Result> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping email to", to);
    return { ok: false, error: "noKey" };
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    return { ok: true };
  } catch (e) {
    console.error("[email] send failed:", e);
    return { ok: false, error: "sendFailed" };
  }
}

/* ── ۱. ایمیل دعوت شاگرد ── */
export async function sendInviteEmail(params: {
  to: string;
  studentName: string;
  teacherName: string;
  inviteUrl: string;
  locale: "fa" | "en";
}): Promise<Result> {
  const { to, studentName, teacherName, inviteUrl, locale } = params;
  const fa = locale === "fa";

  const subject = fa
    ? `${teacherName} شما را به کلاس زبان دعوت کرده`
    : `${teacherName} invited you to a language class`;

  const html = `
    <div style="font-family: Vazirmatn, Tahoma, sans-serif; direction: ${fa ? "rtl" : "ltr"}; background:#f6eede; padding:24px;">
      <div style="max-width:480px; margin:0 auto; background:#fff; border-radius:20px; padding:28px;">
        <h1 style="color:#4a2430; margin:0 0 12px;">
          ${fa ? "🎓 دعوت به کلاس زبان" : "🎓 Class invitation"}
        </h1>
        <p style="color:#40222c; line-height:1.7;">
          ${fa
            ? `سلام <b>${studentName}</b> عزیز،<br/>${teacherName} شما را به کلاس خصوصی زبان خود دعوت کرده است.`
            : `Hi <b>${studentName}</b>,<br/>${teacherName} invited you to their private language class.`}
        </p>
        <a href="${inviteUrl}"
           style="display:inline-block; margin:18px 0; padding:12px 24px; background:#4a2430; color:#f6eede; border-radius:12px; text-decoration:none; font-weight:bold;">
          ${fa ? "مشاهده کلاس و پذیرش دعوت" : "View class & accept invite"}
        </a>
        <p style="color:#96707b; font-size:12px; margin-top:20px;">
          ${fa
            ? "این لینک ۷ روز اعتبار دارد. اگر شما نیستید، این ایمیل را نادیده بگیرید."
            : "This link expires in 7 days. If this wasn't you, ignore this email."}
        </p>
      </div>
    </div>
  `;

  return send(to, subject, html);
}

/* ── ۲. ایمیل رسید پرداخت ── */
export async function sendPaymentReceipt(params: {
  to: string;
  studentName: string;
  amount: number;
  date: string;
  status: "PAID" | "PENDING" | "OVERDUE";
  locale: "fa" | "en";
}): Promise<Result> {
  const { to, studentName, amount, date, status, locale } = params;
  const fa = locale === "fa";

  const fmt = (n: number) =>
    new Intl.NumberFormat(fa ? "fa-IR" : "en-US").format(n);

  const statusLabel =
    status === "PAID"
      ? fa ? "پرداخت شده ✅" : "Paid ✅"
      : status === "OVERDUE"
      ? fa ? "معوق ⚠️" : "Overdue ⚠️"
      : fa ? "در انتظار" : "Pending";

  const subject = fa
    ? `رسید پرداخت — ${fmt(amount)} تومان`
    : `Payment receipt — ${fmt(amount)}`;

  const html = `
    <div style="font-family: Vazirmatn, Tahoma, sans-serif; direction: ${fa ? "rtl" : "ltr"}; background:#f6eede; padding:24px;">
      <div style="max-width:480px; margin:0 auto; background:#fff; border-radius:20px; padding:28px;">
        <h1 style="color:#4a2430; margin:0 0 12px;">
          ${fa ? "💳 رسید پرداخت" : "💳 Payment receipt"}
        </h1>
        <p style="color:#40222c; line-height:1.7;">
          ${fa
            ? `سلام <b>${studentName}</b> عزیز،`
            : `Hi <b>${studentName}</b>,`}
        </p>
        <div style="background:#f7ecd9; border-radius:12px; padding:16px; margin:16px 0;">
          <div style="color:#96707b; font-size:12px;">${fa ? "مبلغ" : "Amount"}</div>
          <div style="color:#4a2430; font-size:22px; font-weight:bold;">
            ${fmt(amount)} ${fa ? "تومان" : ""}
          </div>
          <div style="color:#96707b; font-size:12px; margin-top:8px;">${fa ? "تاریخ" : "Date"}</div>
          <div style="color:#40222c; font-weight:bold;">${date}</div>
          <div style="color:#96707b; font-size:12px; margin-top:8px;">${fa ? "وضعیت" : "Status"}</div>
          <div style="color:#40222c; font-weight:bold;">${statusLabel}</div>
        </div>
      </div>
    </div>
  `;

  return send(to, subject, html);
}
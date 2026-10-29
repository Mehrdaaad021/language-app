import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOverdueEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    /* ── ۱. پیدا کردن پرداخت‌های معوق‌شده (قبل از تغییر وضعیت) ── */
    const becomingOverdue = await prisma.payment.findMany({
      where: { status: "PENDING", date: { lt: now } },
      include: {
        student: true,
        workspace: { include: { owner: true } },
      },
    });

    /* ── ۲. تغییر وضعیت به OVERDUE ── */
    const overdueResult = await prisma.payment.updateMany({
      where: { status: "PENDING", date: { lt: now } },
      data: { status: "OVERDUE" },
    });

    /* ── ۳. ایمیل به شاگرد + نوتیفیکیشن برای معلم ── */
    let emailsSent = 0;
    let notificationsCreated = 0;

    for (const p of becomingOverdue) {
      const owner = p.workspace?.owner;
      const faName = /[\u0600-\u06FF]/.test(owner?.name ?? "");
      const locale: "fa" | "en" = faName ? "fa" : "en";
      const dateStr = p.date.toISOString().split("T")[0];

      // ایمیل به شاگرد
      if (p.student.email) {
        const res = await sendOverdueEmail({
          to: p.student.email,
          studentName: p.student.name,
          teacherName: owner?.name ?? (faName ? "معلم شما" : "Your teacher"),
          amount: p.amount,
          date: dateStr,
          locale,
        });
        if (res.ok) emailsSent++;
      }

      // نوتیفیکیشن برای معلم
      if (owner) {
        await prisma.notification.create({
          data: {
            userId: owner.id,
            title: locale === "fa" ? "پرداخت معوق" : "Overdue payment",
            message:
              locale === "fa"
                ? `پرداخت ${p.student.name} (${dateStr}) معوق شد.`
                : `${p.student.name}'s payment (${dateStr}) is now overdue.`,
          },
        });
        notificationsCreated++;
      }
    }

    /* ── ۴. پاک‌سازی لینک‌های دعوت منقضی ── */
    const expiredInvites = await prisma.student.updateMany({
      where: {
        inviteExpiresAt: { lt: now },
        inviteToken: { not: null },
      },
      data: { inviteToken: null, invitedAt: null, inviteExpiresAt: null },
    });

    /* ── ۵. پاک‌سازی تلاش‌های لاگین قدیمی ── */
    await prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    });

    return NextResponse.json({
      success: true,
      stats: {
        paymentsMarkedOverdue: overdueResult.count,
        emailsSent,
        notificationsCreated,
        invitesCleaned: expiredInvites.count,
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
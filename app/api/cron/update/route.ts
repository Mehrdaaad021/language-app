import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  // محافظت با secret token
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // ۱. پرداخت‌های PENDING که تاریخشون گذشته رو به OVERDUE تبدیل کن
    const overdueResult = await prisma.payment.updateMany({
      where: {
        status: "PENDING",
        date: { lt: now },
      },
      data: { status: "OVERDUE" },
    });

    // ۲. لینک‌های دعوت منقضی‌شده رو پاک کن
    const expiredInvites = await prisma.student.updateMany({
      where: {
        inviteExpiresAt: { lt: now },
        inviteToken: { not: null },
      },
      data: {
        inviteToken: null,
        invitedAt: null,
        inviteExpiresAt: null,
      },
    });

    // ۳. تلاش‌های لاگین قدیمی (بیشتر از ۲۴ ساعت) رو پاک کن
    await prisma.loginAttempt.deleteMany({
      where: {
        createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        paymentsMarkedOverdue: overdueResult.count,
        invitesCleaned: expiredInvites.count,
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
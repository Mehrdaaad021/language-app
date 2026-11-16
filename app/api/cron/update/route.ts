import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* ── قفل: فقط Vercel Cron یا فراخوان با Bearer CRON_SECRET ── */
function authorized(req: Request): boolean {
  const auth = req.headers.get("authorization");
  return !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // ۱) جلسات گذشته‌ی برگزارنشده → برگزارشده
  const completed = await prisma.session.updateMany({
    where: { status: "SCHEDULED", date: { lt: now } },
    data: { status: "COMPLETED" },
  });

  // ۲) پاک‌سازی رکوردهای rate-limit منقضی
  const cleanedLimits = await prisma.rateLimit.deleteMany({
    where: { resetAt: { lt: now } },
  });

  // ۳) پاک‌سازی تلاش‌های ورود قدیمی‌تر از ۲۴ ساعت
  const cleanedAttempts = await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
  });

  return NextResponse.json({
    ok: true,
    completed: completed.count,
    cleanedLimits: cleanedLimits.count,
    cleanedAttempts: cleanedAttempts.count,
    at: now.toISOString(),
  });
}

export async function POST(req: Request) {
  return GET(req);
}
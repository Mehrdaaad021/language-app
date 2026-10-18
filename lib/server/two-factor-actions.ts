"use server";

import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getSession, requireTeacherAction } from "@/lib/auth";
import {
  generateTotpSecret,
  verifyTotpCode,
  buildTotpUri,
} from "@/lib/two-factor";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function startTwoFactorSetup(): Promise<{ secret: string; qrDataUrl: string }> {
  const session = await requireTeacherAction();
  const secret = generateTotpSecret();

  // secret رو موقتاً در دیتابیس می‌نویسیم (غیرفعال) تا بعد از تأیید فعال بشه
  await prisma.user.update({
    where: { id: session.sub },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });

  const uri = buildTotpUri(secret, session.email);
  const qrDataUrl = await QRCode.toDataURL(uri, {
    errorCorrectionLevel: "M",
    width: 320,
    margin: 2,
  });

  return { secret, qrDataUrl };
}

export async function confirmTwoFactorSetup(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireTeacherAction();
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "invalidCode" };

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorSecret || user.twoFactorEnabled) {
    return { ok: false, error: "notPending" };
  }

  const ok = verifyTotpCode(user.twoFactorSecret, code);
  if (!ok) return { ok: false, error: "invalidCode" };

  await prisma.user.update({
    where: { id: session.sub },
    data: { twoFactorEnabled: true },
  });
  return { ok: true };
}

export async function cancelTwoFactorSetup(): Promise<void> {
  const session = await requireTeacherAction();
  await prisma.user.update({
    where: { id: session.sub },
    data: { twoFactorSecret: null, twoFactorEnabled: false },
  });
}

export async function disableTwoFactor(password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireTeacherAction();
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { password: true },
  });
  if (!user) return { ok: false, error: "invalid" };

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return { ok: false, error: "wrongPassword" };

  await prisma.user.update({
    where: { id: session.sub },
    data: { twoFactorSecret: null, twoFactorEnabled: false },
  });
  return { ok: true };
}

export async function getTwoFactorStatus(): Promise<{ enabled: boolean }> {
  const session = await requireTeacherAction();
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { twoFactorEnabled: true },
  });
  return { enabled: user?.twoFactorEnabled ?? false };
}

const verifySchema = z.object({ code: z.string().regex(/^\d{6}$/) });

export async function verifyTwoFactorLogin(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = verifySchema.safeParse({ code });
  if (!parsed.success) return { ok: false, error: "invalidCode" };

  const session = await getSession();
  if (!session || !session.pending2fa) return { ok: false, error: "notPending" };

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { twoFactorSecret: true, twoFactorEnabled: true, role: true, name: true, email: true },
  });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { ok: false, error: "notEnabled" };
  }

  const ok = verifyTotpCode(user.twoFactorSecret, parsed.data.code);
  if (!ok) return { ok: false, error: "invalidCode" };

  // session کامل بساز
  const token = await createSessionToken({
    sub: user.email ? session.sub : session.sub,
    role: user.role,
    name: user.name,
    email: user.email,
    pending2fa: false,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return { ok: true };
}
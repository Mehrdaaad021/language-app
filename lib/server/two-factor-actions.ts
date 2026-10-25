"use server";

import { randomBytes } from "crypto";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  generateTotpSecret,
  verifyTotpCode,
  buildTotpUri,
} from "@/lib/two-factor";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

/* ──────────────────────────────────────────────────── */
/*  Helpers                                              */
/* ──────────────────────────────────────────────────── */

async function requireAuth() {
  const session = await getSession();
  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    throw new Error("Forbidden");
  }
  return session;
}

/** تولید ۱۰ کد بازیابی یک‌بار مصرف (۸ کاراکتر با خط‌تیره) */
function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () => {
    const raw = randomBytes(4).toString("hex").toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  });
}

/** هش‌کردن همه‌ی کدها با bcrypt (salt جدا برای هر کد) */
async function hashBackupCodes(codes: string[]): Promise<string> {
  const hashes = await Promise.all(codes.map((c) => bcrypt.hash(c, 10)));
  return JSON.stringify(hashes);
}

/** بررسی کد ورودی با لیست هش‌ها و حذف کد استفاده‌شده */
async function consumeBackupCode(
  userId: string,
  codesJson: string,
  code: string
): Promise<boolean> {
  let hashes: string[];
  try {
    hashes = JSON.parse(codesJson);
  } catch {
    return false;
  }
  if (!Array.isArray(hashes) || hashes.length === 0) return false;

  const upper = code.toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(upper, hashes[i])) {
      hashes.splice(i, 1);
      await prisma.user.update({
        where: { id: userId },
        data: { backupCodes: JSON.stringify(hashes) },
      });
      return true;
    }
  }
  return false;
}

/* ──────────────────────────────────────────────────── */
/*  شروع راه‌اندازی 2FA: secret + QR + 10 کد بازیابی      */
/* ──────────────────────────────────────────────────── */
export async function startTwoFactorSetup(): Promise<{
  secret: string;
  qrDataUrl: string;
  backupCodes: string[];
}> {
  const session = await requireAuth();
  const secret = generateTotpSecret();
  const backupCodes = generateBackupCodes();
  const backupCodesHashed = await hashBackupCodes(backupCodes);

  await prisma.user.update({
    where: { id: session.sub },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: false,
      backupCodes: backupCodesHashed,
    },
  });

  const uri = buildTotpUri(secret, session.email);
  const qrDataUrl = await QRCode.toDataURL(uri, {
    errorCorrectionLevel: "M",
    width: 320,
    margin: 2,
  });

  return { secret, qrDataUrl, backupCodes };
}

/* ──────────────────────────────────────────────────── */
/*  تأیید TOTP و فعال‌سازی نهایی                         */
/* ──────────────────────────────────────────────────── */
export async function confirmTwoFactorSetup(
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAuth();
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

/* ──────────────────────────────────────────────────── */
/*  لغو راه‌اندازی                                       */
/* ──────────────────────────────────────────────────── */
export async function cancelTwoFactorSetup(): Promise<void> {
  const session = await requireAuth();
  await prisma.user.update({
    where: { id: session.sub },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
      backupCodes: null,
    },
  });
}

/* ──────────────────────────────────────────────────── */
/*  غیرفعال‌سازی با رمز اصلی                             */
/* ──────────────────────────────────────────────────── */
export async function disableTwoFactor(
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { password: true },
  });
  if (!user) return { ok: false, error: "invalid" };

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return { ok: false, error: "wrongPassword" };

  await prisma.user.update({
    where: { id: session.sub },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
      backupCodes: null,
    },
  });
  return { ok: true };
}

/* ──────────────────────────────────────────────────── */
/*  وضعیت 2FA + تعداد کدهای باقی‌مانده                   */
/* ──────────────────────────────────────────────────── */
export async function getTwoFactorStatus(): Promise<{
  enabled: boolean;
  backupCodesRemaining: number;
}> {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { twoFactorEnabled: true, backupCodes: true },
  });

  let remaining = 0;
  if (user?.backupCodes) {
    try {
      const arr = JSON.parse(user.backupCodes);
      if (Array.isArray(arr)) remaining = arr.length;
    } catch {
      remaining = 0;
    }
  }

  return {
    enabled: user?.twoFactorEnabled ?? false,
    backupCodesRemaining: remaining,
  };
}

/* ──────────────────────────────────────────────────── */
/*  بازتولید کدهای بازیابی (با تأیید رمز)                */
/* ──────────────────────────────────────────────────── */
export async function regenerateBackupCodes(
  password: string
): Promise<{ ok: true; backupCodes: string[] } | { ok: false; error: string }> {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { password: true, twoFactorEnabled: true },
  });
  if (!user) return { ok: false, error: "invalid" };
  if (!user.twoFactorEnabled) return { ok: false, error: "notEnabled" };

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return { ok: false, error: "wrongPassword" };

  const backupCodes = generateBackupCodes();
  const hashed = await hashBackupCodes(backupCodes);

  await prisma.user.update({
    where: { id: session.sub },
    data: { backupCodes: hashed },
  });

  return { ok: true, backupCodes };
}

/* ──────────────────────────────────────────────────── */
/*  ورود با 2FA: TOTP یا backup code                     */
/* ──────────────────────────────────────────────────── */
const verifySchema = z.object({ code: z.string().min(6) });

export async function verifyTwoFactorLogin(
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = verifySchema.safeParse({ code });
  if (!parsed.success) return { ok: false, error: "invalidCode" };

  const session = await getSession();
  if (!session || !session.pending2fa) {
    return { ok: false, error: "notPending" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      twoFactorSecret: true,
      twoFactorEnabled: true,
      backupCodes: true,
      role: true,
      name: true,
      email: true,
    },
  });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { ok: false, error: "notEnabled" };
  }

  let authenticated = false;

  // اول TOTP رو چک کن
  if (/^\d{6}$/.test(parsed.data.code)) {
    authenticated = verifyTotpCode(user.twoFactorSecret, parsed.data.code);
  }

  // اگه TOTP نبود یا نامعتبر بود، backup code رو چک کن
  if (!authenticated && user.backupCodes) {
    authenticated = await consumeBackupCode(
      session.sub,
      user.backupCodes,
      parsed.data.code
    );
  }

  if (!authenticated) return { ok: false, error: "invalidCode" };

  // session کامل بساز (بدون pending2fa)
  const token = await createSessionToken({
    sub: session.sub,
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
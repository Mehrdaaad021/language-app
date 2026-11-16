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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Helpers                                              */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

async function requireAuth() {
  const session = await getSession();
  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    throw new Error("Forbidden");
  }
  return session;
}

/** ØªÙˆÙ„ÛŒØ¯ Û±Û° Ú©Ø¯ Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ ÛŒÚ©â€ŒØ¨Ø§Ø± Ù…ØµØ±Ù (Û¸ Ú©Ø§Ø±Ø§Ú©ØªØ± Ø¨Ø§ Ø®Ø·â€ŒØªÛŒØ±Ù‡) */
function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () => {
    const raw = randomBytes(4).toString("hex").toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  });
}

/** Ù‡Ø´â€ŒÚ©Ø±Ø¯Ù† Ù‡Ù…Ù‡â€ŒÛŒ Ú©Ø¯Ù‡Ø§ Ø¨Ø§ bcrypt (salt Ø¬Ø¯Ø§ Ø¨Ø±Ø§ÛŒ Ù‡Ø± Ú©Ø¯) */
async function hashBackupCodes(codes: string[]): Promise<string> {
  const hashes = await Promise.all(codes.map((c) => bcrypt.hash(c, 10)));
  return JSON.stringify(hashes);
}

/** Ø¨Ø±Ø±Ø³ÛŒ Ú©Ø¯ ÙˆØ±ÙˆØ¯ÛŒ Ø¨Ø§ Ù„ÛŒØ³Øª Ù‡Ø´â€ŒÙ‡Ø§ Ùˆ Ø­Ø°Ù Ú©Ø¯ Ø§Ø³ØªÙØ§Ø¯Ù‡â€ŒØ´Ø¯Ù‡ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Ø´Ø±ÙˆØ¹ Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ 2FA: secret + QR + 10 Ú©Ø¯ Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ      */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  ØªØ£ÛŒÛŒØ¯ TOTP Ùˆ ÙØ¹Ø§Ù„â€ŒØ³Ø§Ø²ÛŒ Ù†Ù‡Ø§ÛŒÛŒ                         */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Ù„ØºÙˆ Ø±Ø§Ù‡â€ŒØ§Ù†Ø¯Ø§Ø²ÛŒ                                       */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  ØºÛŒØ±ÙØ¹Ø§Ù„â€ŒØ³Ø§Ø²ÛŒ Ø¨Ø§ Ø±Ù…Ø² Ø§ØµÙ„ÛŒ                             */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  ÙˆØ¶Ø¹ÛŒØª 2FA + ØªØ¹Ø¯Ø§Ø¯ Ú©Ø¯Ù‡Ø§ÛŒ Ø¨Ø§Ù‚ÛŒâ€ŒÙ…Ø§Ù†Ø¯Ù‡                   */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Ø¨Ø§Ø²ØªÙˆÙ„ÛŒØ¯ Ú©Ø¯Ù‡Ø§ÛŒ Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ (Ø¨Ø§ ØªØ£ÛŒÛŒØ¯ Ø±Ù…Ø²)                */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  ÙˆØ±ÙˆØ¯ Ø¨Ø§ 2FA: TOTP ÛŒØ§ backup code                     */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  // Ø§ÙˆÙ„ TOTP Ø±Ùˆ Ú†Ú© Ú©Ù†
  if (/^\d{6}$/.test(parsed.data.code)) {
    authenticated = verifyTotpCode(user.twoFactorSecret, parsed.data.code);
  }

  // Ø§Ú¯Ù‡ TOTP Ù†Ø¨ÙˆØ¯ ÛŒØ§ Ù†Ø§Ù…Ø¹ØªØ¨Ø± Ø¨ÙˆØ¯ØŒ backup code Ø±Ùˆ Ú†Ú© Ú©Ù†
  if (!authenticated && user.backupCodes) {
    authenticated = await consumeBackupCode(
      session.sub,
      user.backupCodes,
      parsed.data.code
    );
  }

  if (!authenticated) return { ok: false, error: "invalidCode" };

  // session Ú©Ø§Ù…Ù„ Ø¨Ø³Ø§Ø² (Ø¨Ø¯ÙˆÙ† pending2fa)
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

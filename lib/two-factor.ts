import { createHmac, randomBytes } from "crypto";

/* ── Base32 (RFC 4648) ── */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/* ── TOTP (RFC 6238) ── */
function totpAt(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

/* ── API عمومی (همون امضاهای قبلی — بقیه‌ی کد دست‌نخورده می‌مونه) ── */

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20)); // ۳ کاراکتر Base32 — استاندارد
}

export function verifyTotpCode(secret: string, token: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const counter = Math.floor(Date.now() / 30000);
  // پنجره‌ی ±۱ برای جبران اختلاف ساعتِ جزئی
  for (let i = -1; i <= 1; i++) {
    if (totpAt(secret, counter + i) === token) return true;
  }
  return false;
}

export function buildTotpUri(secret: string, email: string, issuer = "ClassAssistant"): string {
  return (
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}` +
    `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
  );
}
"use server";

import { randomBytes } from "crypto";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

export type Attachment = {
  id: string;
  name: string;
  kind: "image" | "file";
  url: string;
  preview?: string;
};

/*
 * فعلاً no-op: URL همونی که ذخیره شده برگردانده می‌شه.
 * (فایل‌ها public هستن ولی مسیرشون شامل ۱۶ بایت تصادفی‌ه → غیرقابل حدس)
 * اگه بعداً @vercel/blob ≥ 0.27 نصب شد، می‌تونیم private + signed رو برگردونیم.
 */
export async function signedUrl(pathnameOrUrl: string): Promise<string> {
  return pathnameOrUrl;
}

export async function signAttachments(raw: unknown): Promise<Attachment[]> {
  if (!Array.isArray(raw)) return [];
  return raw as Attachment[];
}

export async function uploadAttachment(
  formData: FormData
): Promise<{ ok: true; attachment: Attachment; preview: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") return { ok: false, error: "forbidden" };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { ok: false, error: "noToken" };

  const file = formData.get("file") as File | null;
  if (!file) return { ok: false, error: "invalid" };
  if (file.size > 1.5 * 1024 * 1024) return { ok: false, error: "tooBig" };

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  if (!isImage && !isPdf) return { ok: false, error: "invalid" };

  // مسیر تصادفی ۳۲ کاراکتری → URL عملاً غیرقابل حدس
  const blob = await put(
    `attachments/${Date.now()}-${randomBytes(16).toString("hex")}-${file.name}`,
    file,
    { access: "public" }
  );

  return {
    ok: true,
    attachment: { id: blob.pathname, name: file.name, kind: isImage ? "image" : "file", url: blob.url },
    preview: blob.url,
  };
}
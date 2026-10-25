"use server";

import { getSession } from "@/lib/auth";

/**
 * فقط سمت سرور اجرا می‌شه: بررسی می‌کنه کاربر فعلی مالک اصلی هست یا نه.
 */
export async function isOwner(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return session.email === process.env.OWNER_EMAIL;
}
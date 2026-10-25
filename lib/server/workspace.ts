import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * نسخه‌ی امن: اگه معلم نباشه یا workspace نداشته باشه، null برمی‌گردونه (خطا نمی‌ده).
 */
export async function getTeacherWorkspace(): Promise<{ userId: string; workspaceId: string } | null> {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") return null;
  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.sub },
    select: { id: true },
  });
  if (!workspace) return null;
  return { userId: session.sub, workspaceId: workspace.id };
}

/**
 * نسخه‌ی سخت: برای عملیات نوشتن (create/update). اگه معلم نباشه، پرتاب می‌کنه.
 */
export async function requireTeacherWorkspace(): Promise<{ userId: string; workspaceId: string }> {
  const ctx = await getTeacherWorkspace();
  if (!ctx) throw new Error("FORBIDDEN");
  return ctx;
}
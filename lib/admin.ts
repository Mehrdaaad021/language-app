import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { platformRole: true, suspended: true },
  });

  if (!user || user.platformRole !== "ADMIN" || user.suspended) {
    redirect("/dashboard");
  }

  return { userId: session.sub };
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { platformRole: true },
  });
  return user?.platformRole === "ADMIN";
}
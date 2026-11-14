import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ isAdmin: false });

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { platformRole: true, suspended: true },
    });

    const isAdmin = user?.platformRole === "ADMIN" && !user?.suspended;
    return NextResponse.json({ isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
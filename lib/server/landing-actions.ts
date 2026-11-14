"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/* ═══════════ انواع ═══════════ */

export type Feature = { title: string; desc: string };
export type Testimonial = { name: string; role: string; text: string };
export type Pricing = {
  title: string;
  price: string;
  period: string;
  highlight: boolean;
  features: string[];
};

export type LandingData = {
  workspaceId: string | null;
  slug: string;
  heroBadge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  accentColor: string;
  aboutText: string;
  contactInfo: string;
  features: Feature[];
  testimonials: Testimonial[];
  pricing: Pricing[];
};

const j = (v: unknown, fallback: unknown[]) => (Array.isArray(v) ? (v as unknown[]) : fallback);

/* ═══════════ ویرایشگر لندینگ (ادمین) ═══════════ */

export async function getLandingWorkspaces() {
  await requireAdmin();
  const rows = await prisma.workspace.findMany({
    include: { owner: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((w) => ({
    id: w.id,
    ownerName: w.owner.name ?? "—",
    name: w.name,
    slug: w.slug ?? "",
  }));
}

export async function getLandingForWorkspace(workspaceId: string | null): Promise<LandingData> {
  await requireAdmin();
  const ws = workspaceId
    ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
    : null;
  const row = workspaceId
    ? await prisma.landingContent.findUnique({ where: { workspaceId } })
    : null;

  return {
    workspaceId,
    slug: ws?.slug ?? "",
    heroBadge: row?.heroBadge ?? "",
    heroTitle1: row?.heroTitle1 ?? "",
    heroTitle2: row?.heroTitle2 ?? "",
    heroSub: row?.heroSub ?? "",
    ctaPrimary: row?.ctaPrimary ?? "",
    ctaSecondary: row?.ctaSecondary ?? "",
    accentColor: row?.accentColor || "#D94F63",
    aboutText: row?.aboutText ?? "",
    contactInfo: row?.contactInfo ?? "",
    features: j(row?.features, []) as Feature[],
    testimonials: j(row?.testimonials, []) as Testimonial[],
    pricing: j(row?.pricing, []) as Pricing[],
  };
}

export async function upsertLanding(input: LandingData): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  if (input.workspaceId) {
    const slug = input.slug.trim() || null;
    if (slug) {
      const clash = await prisma.workspace.findFirst({
        where: { slug, NOT: { id: input.workspaceId } },
      });
      if (clash) return { ok: false, error: "SLUG_TAKEN" };
    }
    try {
      await prisma.workspace.update({ where: { id: input.workspaceId }, data: { slug } });
    } catch {
      return { ok: false, error: "SLUG_TAKEN" };
    }
  }

  const data = {
    heroBadge: input.heroBadge,
    heroTitle1: input.heroTitle1,
    heroTitle2: input.heroTitle2,
    heroSub: input.heroSub,
    ctaPrimary: input.ctaPrimary,
    ctaSecondary: input.ctaSecondary,
    accentColor: input.accentColor,
    aboutText: input.aboutText,
    contactInfo: input.contactInfo,
    features: input.features as unknown as object[],
    testimonials: input.testimonials as unknown as object[],
    pricing: input.pricing as unknown as object[],
  };

  if (input.workspaceId) {
    await prisma.landingContent.upsert({
      where: { workspaceId: input.workspaceId },
      create: { workspaceId: input.workspaceId, ...data },
      update: data,
    });
  }
  return { ok: true };
}

/* ═══════════ لندینگ عمومی /t/[slug] ═══════════ */

export async function getPublicLandingBySlug(slug: string) {
  const ws = await prisma.workspace.findUnique({
    where: { slug },
    include: { owner: true, landing: true, _count: { select: { students: true } } },
  });
  if (!ws || ws.suspended) return null;

  const l = ws.landing;
  return {
    teacherName: ws.owner.name ?? ws.name,
    slug: ws.slug ?? "",
    heroBadge: l?.heroBadge || "کلاس خصوصی زبان",
    heroTitle1: l?.heroTitle1 || "یادگیری زبان،",
    heroTitle2: l?.heroTitle2 || "قدم‌به‌قدم کنار تو",
    heroSub: l?.heroSub || "جلسات خصوصی آنلاین با برنامه‌ی شخصی‌سازی‌شده.",
    ctaPrimary: l?.ctaPrimary || "رزرو جلسه‌ی اول",
    ctaSecondary: l?.ctaSecondary || "دیدن تعرفه‌ها",
    accentColor: l?.accentColor || "#D94F63",
    aboutText: l?.aboutText || "",
    contactInfo: l?.contactInfo || "",
    features: j(l?.features, []) as Feature[],
    testimonials: j(l?.testimonials, []) as Testimonial[],
    pricing: j(l?.pricing, []) as Pricing[],
    studentCount: ws._count.students,
  };
}

/* ═══════════ رزرو جلسه (Booking) ═══════════ */

export async function createBookingRequest(
  slug: string,
  input: { name: string; phone: string; note?: string }
): Promise<{ ok: boolean }> {
  const ws = await prisma.workspace.findUnique({ where: { slug } });
  if (!ws || ws.suspended) return { ok: false };

  await prisma.bookingRequest.create({
    data: {
      workspaceId: ws.id,
      name: input.name.trim(),
      phone: input.phone.trim(),
      note: input.note?.trim() ?? "",
    },
  });

  const owner = await prisma.workspace.findUnique({
    where: { id: ws.id },
    include: { owner: true },
  });
  if (owner?.owner) {
    await prisma.notification.create({
      data: {
        userId: owner.owner.id,
        title: "درخواست رزرو جلسه",
        message: `${input.name} (${input.phone}) درخواست جلسه داد.`,
      },
    });
  }
  return { ok: true };
}

export async function getTeacherBookings() {
  const { requireTeacherWorkspace } = await import("./workspace");
  const { workspaceId } = await requireTeacherWorkspace();
  const rows = await prisma.bookingRequest.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function setBookingStatus(id: string, status: string): Promise<{ ok: boolean }> {
  const { requireTeacherWorkspace } = await import("./workspace");
  const { workspaceId } = await requireTeacherWorkspace();
  await prisma.bookingRequest.updateMany({ where: { id, workspaceId }, data: { status } });
  return { ok: true };
}
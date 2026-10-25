import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking teachers...");
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true },
  });

  // ۱) برای هر معلم یک workspace بساز (اگه نداره)
  for (const teacher of teachers) {
    const existing = await prisma.workspace.findFirst({ where: { ownerId: teacher.id } });
    if (existing) {
      console.log(`✓ Workspace exists for ${teacher.email}`);
      continue;
    }
    await prisma.workspace.create({
      data: { name: teacher.name ?? "My Workspace", ownerId: teacher.id },
    });
    console.log(`📦 Workspace created for ${teacher.email}`);
  }

  // ۲) داده‌های یتیم (بدون workspace) رو به قدیمی‌ترین معلم بچسبان
  const oldest = teachers[0];
  if (oldest) {
    const workspace = await prisma.workspace.findFirst({ where: { ownerId: oldest.id } });
    if (workspace) {
      const [a, b, c, d] = await Promise.all([
        prisma.student.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } }),
        prisma.session.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } }),
        prisma.payment.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } }),
        prisma.note.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } }),
      ]);
      console.log(
        `→ Orphans moved to ${oldest.email}: ${a.count} students, ${b.count} sessions, ${c.count} payments, ${d.count} notes`
      );
    }
  }

  console.log("✅ Migration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
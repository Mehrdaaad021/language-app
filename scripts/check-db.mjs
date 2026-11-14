import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL,  // ← تغییر کلیدی: استفاده از direct URL
});

try {
  const roles = await prisma.$queryRaw`
    SELECT role::text, COUNT(*)::int AS count FROM "User" GROUP BY role
  `;

  const statuses = await prisma.$queryRaw`
    SELECT status::text, COUNT(*)::int AS count FROM "Session" GROUP BY status
  `;

  console.log("── نقش کاربران ──");
  console.table(roles);
  console.log("── وضعیت جلسات ──");
  console.table(statuses);
} catch (e) {
  console.error("Error:", e.message);
} finally {
  await prisma.$disconnect();
}
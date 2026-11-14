import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

const EMAIL = "mehrdaad@atomicmail.io";
const NEW_PASS = "Admin@1234";

const hash = await bcrypt.hash(NEW_PASS, 10);

await prisma.user.update({
  where: { email: EMAIL },
  data: {
    password: hash,
    mustChangePassword: false,
    suspended: false,
    twoFactorEnabled: false,
  },
});

// پاک کردن قفل‌های ورود
try {
  await prisma.loginAttempt.deleteMany({ where: { email: EMAIL } });
} catch {}

console.log("✅ رمز جدید ست شد:", NEW_PASS);
await prisma.$disconnect();
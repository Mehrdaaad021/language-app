New-Item -ItemType Directory -Force scripts
@"
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

try {
  const count = await p.user.count();
  console.log('✅ اتصال موفق - تعداد کاربران:', count);
  await p.\$disconnect();
} catch (e) {
  console.log('❌ خطا:', e.message);
}
"@ | Set-Content scripts\test-db.mjs -Encoding UTF8
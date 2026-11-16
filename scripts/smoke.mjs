const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const checks = [
  { name: "landing public", path: "/en", expect: [200] },
  { name: "cron locked (no secret)", path: "/api/cron/update", expect: [401] },
  { name: "admin requires auth", path: "/fa/admin", expect: [302, 303, 307] },
  { name: "dashboard requires auth", path: "/fa/dashboard", expect: [302, 303, 307] },
  { name: "student area requires auth", path: "/fa/student", expect: [302, 303, 307] },
  { name: "settings requires auth", path: "/fa/settings", expect: [302, 303, 307] },
];

console.log(`\nSmoke against ${base}\n`);
let fail = 0;
for (const c of checks) {
  const res = await fetch(base + c.path, { redirect: "manual" });
  const ok = c.expect.includes(res.status);
  if (!ok) fail++;
  console.log(`${ok ? "✅" : "🚨"} ${c.name} → ${res.status}`);
}

if (process.env.CRON_SECRET) {
  const res = await fetch(base + "/api/cron/update", {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  const ok = res.status === 200;
  if (!ok) fail++;
  console.log(`${ok ? "✅" : "🚨"} cron with secret → ${res.status}`);
} else {
  console.log("⚠️ CRON_SECRET not set — skipped authorized cron check");
}

console.log(fail === 0 ? "\n✅ ALL GREEN" : `\n🚨 ${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
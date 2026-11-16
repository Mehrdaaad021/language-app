import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/* ── guard هایی که وجودشان یعنی اکشن محافظت‌شده است ── */
const GUARDS = [
  "requireTeacherWorkspace", "requireTeacherContext", "requireStudentContext",
  "requireAdmin", "requireTeacherAction", "requireSession", "getSession",
  "getTeacherWorkspace", "isAdmin", "isOwner", "requireAuth",
];

/* ── اکشن‌های عمومیِ طراحی‌شده که باید rate-limit داشته باشند ── */
const PUBLIC = [
  "loginAction", "setupTeacher", "getSiteConfig",
  "getPublicLandingBySlug", "getInviteInfo", "claimInvite",
  "createBookingRequest", "verifyTwoFactorLogin",
];

/* ── عمومیِ امن: idempotent و فقط روی نشست خودِ فراخوان اثر می‌گذارد ── */
const SAFE_PUBLIC = ["logoutAction"];

/* ── متغیرهای compile-time که secret محسوب نمی‌شوند ── */
const CLIENT_SAFE_ENV = ["NODE_ENV"];

console.log("\n=== SERVER ACTIONS ===");
const dir = "lib/server";
for (const f of readdirSync(dir).filter((x) => x.endsWith(".ts"))) {
  const src = readFileSync(join(dir, f), "utf8");
  if (!/["']use server["']/.test(src)) continue;

  const re = /export\s+async\s+function\s+(\w+)/g;
  let m;
  while ((m = re.exec(src))) {
    const next = src.indexOf("export async function", m.index + 10);
    const body = src.slice(m.index, next === -1 ? src.length : next);

    const guarded = GUARDS.some((g) => body.includes(g));
    if (guarded) {
      console.log(`✅ ${f} → ${m[1]}`);
      continue;
    }
    if (SAFE_PUBLIC.includes(m[1])) {
      console.log(`✅ public-safe  ${f} → ${m[1]}`);
      continue;
    }
    if (PUBLIC.includes(m[1])) {
      const limited = body.includes("enforceRateLimit");
      console.log(`${limited ? "✅ public+limited" : "🟡 PUBLIC-NO-RATELIMIT"}  ${f} → ${m[1]}`);
    } else {
      console.log(`🚨 UNGUARDED  ${f} → ${m[1]}`);
    }
  }
}

console.log("\n=== CLIENT SECRET LEAKS ===");
const walk = (d) => {
  if (!existsSync(d)) return [];
  return readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = join(d, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(tsx|ts)$/.test(e.name) ? [p] : [];
  });
};
let leaks = 0;
for (const p of [...walk("components"), ...walk("app")]) {
  const src = readFileSync(p, "utf8");
  if (!/["']use client["']/.test(src)) continue;
  const bad = [...src.matchAll(/process\.env\.([A-Z_]+)/g)]
    .map((x) => x[1])
    .filter((k) => !k.startsWith("NEXT_PUBLIC_") && !CLIENT_SAFE_ENV.includes(k));
  if (bad.length) {
    console.log(`🚨 ${p} → ${[...new Set(bad)].join(", ")}`);
    leaks++;
  }
}
if (!leaks) console.log("✅ none");

console.log("\n=== ENV HYGIENE ===");
const gi = existsSync(".gitignore") ? readFileSync(".gitignore", "utf8") : "";
console.log(
  gi.split("\n").some((l) => l.trim() === ".env")
    ? "✅ .env in .gitignore"
    : "🚨 .env NOT ignored"
);

console.log("\nDone.");
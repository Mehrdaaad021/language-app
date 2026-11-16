import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, verifySessionToken } from "./lib/session";

const intlMiddleware = createMiddleware(routing);
type Sess = NonNullable<Awaited<ReturnType<typeof verifySessionToken>>>;

function homeFor(role: "ADMIN" | "TEACHER" | "STUDENT", locale: string) {
  if (role === "ADMIN") return `/${locale}/admin`;
  if (role === "TEACHER") return `/${locale}/dashboard`;
  return `/${locale}/student`;
}

function harden(res: NextResponse, isPrivate: boolean) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  if (isPrivate) res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

async function slide(req: NextRequest, res: NextResponse, session: Sess | null, raw?: string) {
  if (!session || !raw) return res;
  try {
    const payload = decodeJwt(raw);
    const iat = typeof payload.iat === "number" ? payload.iat : 0;
    if (Math.floor(Date.now() / 1000) - iat > SESSION_MAX_AGE / 2) {
      const token = await createSessionToken({
        sub: session.sub, role: session.role, name: session.name, email: session.email,
        mustChangePassword: session.mustChangePassword ?? false,
        pending2fa: session.pending2fa ?? false,
      });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true, sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE, path: "/",
      });
    }
  } catch {}
  return res;
}

export default async function middleware(req: NextRequest) {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(raw);
  const pathname = req.nextUrl.pathname;

  const locale =
    routing.locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)) ??
    routing.defaultLocale;
  const stripped = pathname === `/${locale}` ? "/" : pathname.replace(`/${locale}`, "");

  const isPublic = ["/", "/login", "/setup"].includes(stripped);
  const isInvite = stripped.startsWith("/invite/");
  const isAuthPage = stripped === "/login" || stripped === "/setup";
  const isVerify2fa = stripped === "/login/verify-2fa";
  const isChangePassword = stripped === "/change-password";
  const isStudentArea = stripped === "/student" || stripped.startsWith("/student/");
  const isAdminArea = stripped === "/admin" || stripped.startsWith("/admin/");
  const isPublicTeacherLanding = stripped.startsWith("/t/");
  const isLandingEditor =
    stripped === "/dashboard/landing-editor" || stripped.startsWith("/dashboard/landing-editor/");
  const isPrivate = !isPublic && !isInvite && !isPublicTeacherLanding;

  const url = req.nextUrl.clone();
  const done = async (res: NextResponse) => harden(await slide(req, res, session, raw), isPrivate);
  const redirect = () => harden(NextResponse.redirect(url), isPrivate);

  if (isPublic || isInvite || isPublicTeacherLanding) return done(intlMiddleware(req));

  if (!session) { url.pathname = `/${locale}/login`; return redirect(); }

  if (session.pending2fa && !isVerify2fa) { url.pathname = `/${locale}/login/verify-2fa`; return redirect(); }

  if (isAuthPage) { url.pathname = homeFor(session.role, locale); return redirect(); }

  if (session.mustChangePassword && !isChangePassword) { url.pathname = `/${locale}/change-password`; return redirect(); }

  if (isLandingEditor) {
    if (session.role !== "TEACHER" || session.email !== process.env.OWNER_EMAIL) {
      url.pathname = `/${locale}/dashboard`; return redirect();
    }
    return done(intlMiddleware(req));
  }

  if (session.role === "STUDENT" && !isStudentArea && !isChangePassword) {
    url.pathname = `/${locale}/student`; return redirect();
  }
  if (session.role === "TEACHER" && isStudentArea) {
    url.pathname = `/${locale}/dashboard`; return redirect();
  }

  return done(intlMiddleware(req));
}

export const config = { matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"] };
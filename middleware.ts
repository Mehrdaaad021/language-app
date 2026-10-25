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

/* انقضای لغزنده: اگه نصف عمر توکن گذشته، توکن تازه بده */
async function slide(req: NextRequest, res: NextResponse, session: Sess | null, raw?: string) {
  if (!session || !raw) return res;
  try {
    const payload = decodeJwt(raw);
    const iat = typeof payload.iat === "number" ? payload.iat : 0;
    const age = Math.floor(Date.now() / 1000) - iat;
    if (age > SESSION_MAX_AGE / 2) {
      const token = await createSessionToken({
        sub: session.sub,
        role: session.role,
        name: session.name,
        email: session.email,
        mustChangePassword: session.mustChangePassword ?? false,
        pending2fa: session.pending2fa ?? false,
      });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      });
    }
  } catch {
    // بی‌صدا
  }
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
  const isLandingEditor =
    stripped === "/dashboard/landing-editor" || stripped.startsWith("/dashboard/landing-editor/");
  const isTeacherArea =
    !isPublic &&
    !isInvite &&
    !isAuthPage &&
    !isVerify2fa &&
    !isStudentArea &&
    !isAdminArea &&
    !isChangePassword &&
    !isLandingEditor;

  const url = req.nextUrl.clone();
  const done = (res: NextResponse) => slide(req, res, session, raw);

  if (isInvite) return done(intlMiddleware(req));

  if (session && session.pending2fa) {
    if (!isVerify2fa) {
      url.pathname = `/${locale}/login/verify-2fa`;
      return NextResponse.redirect(url);
    }
    return done(intlMiddleware(req));
  }

  if (!session) {
    if (!isPublic) {
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
    return done(intlMiddleware(req));
  }

  if (isAuthPage) {
    url.pathname = homeFor(session.role, locale);
    return NextResponse.redirect(url);
  }

  if (session.mustChangePassword && !isChangePassword) {
    url.pathname = `/${locale}/change-password`;
    return NextResponse.redirect(url);
  }

  if (isLandingEditor) {
    if (session.role !== "TEACHER" || session.email !== process.env.OWNER_EMAIL) {
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
    return done(intlMiddleware(req));
  }

  if (session.role === "ADMIN") {
    if (isStudentArea || isTeacherArea) {
      url.pathname = `/${locale}/admin`;
      return NextResponse.redirect(url);
    }
    return done(intlMiddleware(req));
  }

  if (session.role === "TEACHER") {
    if (isStudentArea || isAdminArea) {
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
    return done(intlMiddleware(req));
  }

  if (!isStudentArea && !isChangePassword) {
    url.pathname = `/${locale}/student`;
    return NextResponse.redirect(url);
  }
  return done(intlMiddleware(req));
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
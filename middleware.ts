import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const pathname = req.nextUrl.pathname;

  const locale =
    routing.locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)) ??
    routing.defaultLocale;
  const stripped = pathname === `/${locale}` ? "/" : pathname.replace(`/${locale}`, "");

  const PUBLIC_PATHS = ["/", "/login", "/setup"];
  const isPublic = PUBLIC_PATHS.includes(stripped);
  const isInvite = stripped.startsWith("/invite/");
  const isAuthPage = stripped === "/login" || stripped === "/setup";
  const isVerify2fa = stripped === "/login/verify-2fa";
  const isStudentArea = stripped === "/student" || stripped.startsWith("/student/");

  const url = req.nextUrl.clone();

  // مسیر invite همیشه بازه
  if (isInvite) return intlMiddleware(req);

  // session موقت 2FA: فقط verify-2fa مجازه
  if (session && session.pending2fa) {
    if (!isVerify2fa) {
      url.pathname = `/${locale}/login/verify-2fa`;
      return NextResponse.redirect(url);
    }
    return intlMiddleware(req);
  }

  if (!session && !isPublic) {
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }
  if (session && isAuthPage && !isVerify2fa) {
    url.pathname = session.role === "TEACHER" ? `/${locale}/dashboard` : `/${locale}/student`;
    return NextResponse.redirect(url);
  }
  if (session && session.role === "STUDENT" && !isStudentArea && !isPublic) {
    url.pathname = `/${locale}/student`;
    return NextResponse.redirect(url);
  }
  if (session && session.role === "TEACHER" && isStudentArea) {
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
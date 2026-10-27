import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/fa", "/en"],
        disallow: [
          "/fa/dashboard", "/fa/students", "/fa/sessions", "/fa/payments", "/fa/notes",
          "/fa/analytics", "/fa/settings", "/fa/admin", "/fa/student", "/fa/login",
          "/fa/setup", "/fa/change-password", "/fa/invite",
          "/en/dashboard", "/en/students", "/en/sessions", "/en/payments", "/en/notes",
          "/en/analytics", "/en/settings", "/en/admin", "/en/student", "/en/login",
          "/en/setup", "/en/change-password", "/en/invite",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
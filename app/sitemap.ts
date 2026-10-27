import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/fa`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/en`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];
}
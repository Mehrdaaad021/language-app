import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "دستیار کلاس زبان | Language Class Assistant",
    short_name: "ClassAssist",
    description:
      "مدیریت کلاس‌های خصوصی زبان — Management for private language classes",
    start_url: "/fa",
    scope: "/",
    display: "standalone",
    background_color: "#f6eede",
    theme_color: "#4a2430",
    dir: "rtl",
    lang: "fa",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
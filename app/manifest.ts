import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Language Class Assistant",
    short_name: "ClassAssist",
    description: "Digital management for private language classes",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF4DE",
    theme_color: "#D94F63",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
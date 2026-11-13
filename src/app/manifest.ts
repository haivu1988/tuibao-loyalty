import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TUIBAO Loyalty",
    short_name: "TUIBAO",
    description: "Tích điểm & đổi quà trà sữa TUIBAO 🧋",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3fbee",
    theme_color: "#3d8a24",
    icons: [
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

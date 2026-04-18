import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BeGift",
    short_name: "BeGift",
    description: "Regali digitali emozionali",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f2",
    theme_color: "#D4537E",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

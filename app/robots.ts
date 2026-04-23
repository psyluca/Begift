import type { MetadataRoute } from "next";

/**
 * robots.txt dinamico.
 * - Crawler pubblici possono indicizzare le landing SEO
 * - Bloccate route private (gift, dashboard, auth, settings,
 *   admin, api) per evitare leak di URL privati / indicizzazione
 *   di pagine non rilevanti
 * - Link al sitemap per aiutare i crawler
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://begift.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/gift/",       // regali privati, link univoci
          "/dashboard",
          "/auth/",
          "/settings",    // e sub-route
          "/admin/",
          "/api/",
          "/reactions",   // dashboard reazioni utente loggato
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

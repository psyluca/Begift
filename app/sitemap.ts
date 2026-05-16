import type { MetadataRoute } from "next";

/**
 * Sitemap dinamico per SEO.
 * Include landing + SEO pages per occasione + install. Esclude
 * route private (/gift/[id], /dashboard, /settings, /admin, /auth).
 *
 * Next.js App Router espone automaticamente questo a /sitemap.xml
 * quando il file si chiama app/sitemap.ts. Aggiornato ad ogni build.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://begift.app";
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // Occasion landing pages — alta priorità SEO
    {
      url: `${baseUrl}/compleanno`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/anniversario`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/laurea`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/san-valentino`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/natale`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/onomastico`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      // Festa della Mamma — landing speciale "Lettera che cresce".
      // Priority alta nei mesi prima del 10 maggio (Festa Mamma 2026).
      url: `${baseUrl}/festa-mamma`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      // Festa del Papà — stesso template "Lettera che cresce" per il 19 giugno.
      url: `${baseUrl}/festa-papa`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.92,
    },
    // Pagine pilastro per AEO: use case long-form + FAQ + press
    {
      url: `${baseUrl}/per-chi`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/press`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/install`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // ── Catalogo esperienze + landing SEO dinamiche ─────────
    {
      url: `${baseUrl}/discover`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/start`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    // /regali-a/[city] - le città principali del catalogo
    ...["roma", "milano", "firenze", "venezia", "napoli", "lucca"].map(
      (city) => ({
        url: `${baseUrl}/regali-a/${city}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })
    ),
    // /regali-per/[occasion] - occasioni mappate a tag catalogo
    ...[
      "coppia",
      "anniversario",
      "festa-mamma",
      "festa-papa",
      "foodie",
      "compleanno",
      "amici",
    ].map((occ) => ({
      url: `${baseUrl}/regali-per/${occ}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: `${baseUrl}/security`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

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
      // Matrimonio — landing SEO long-form lanciata 2026-05-23.
      // Stagione apr-set, priority weekly nei mesi caldi.
      url: `${baseUrl}/matrimonio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.92,
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
    // ── Hub /regalo + catalogo esperienze ─────────
    // /regalo è l'hub unificato lanciato 2026-05-21 (sostituisce /start).
    {
      url: `${baseUrl}/regalo`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/regalo/catalogo`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/regalo/fisici`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    // NOTA 2026-06-03: rimosse dal sitemap le route /regali-a/[city],
    // /regali-per/[occasion] e /start. Ora redirezionano 301 a URL canoniche
    // (vedi next.config.mjs). Google le riconoscerà come deprecate e
    // smetterà di tenerle in indice. /discover rimosso perché sostituito
    // da /regalo/catalogo.
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

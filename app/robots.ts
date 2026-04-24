import type { MetadataRoute } from "next";

/**
 * robots.txt dinamico.
 *
 * Strategia per AEO (Answer Engine Optimization):
 * - Crawler pubblici (Googlebot, Bingbot) indicizzano le landing SEO
 * - Crawler LLM (GPTBot, ClaudeBot, Google-Extended, PerplexityBot,
 *   Applebot-Extended, CCBot) sono ESPLICITAMENTE AMMESSI sulle pagine
 *   pubbliche per essere citati quando qualcuno chiede "idee regalo"
 *   a un assistente AI.
 * - Bloccate per TUTTI le route private (gift, dashboard, auth, settings,
 *   admin, api) per evitare leak di UGC/PII e indicizzazione di pagine
 *   non rilevanti.
 *
 * Nota: rendiamo le regole private esplicite per ogni LLM bot in modo
 * che non ci sia ambiguita' nell'opt-in. Applebot-Extended e CCBot sono
 * i meno conosciuti ma significativi (CCBot = CommonCrawl, training
 * dataset usato da molti modelli; Applebot-Extended = future generative
 * features Apple).
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://begift.app";

  const privateRoutes = [
    "/gift/",       // regali privati, link univoci
    "/dashboard",
    "/auth/",
    "/settings",    // e sub-route
    "/admin/",
    "/api/",
    "/reactions",   // dashboard reazioni utente loggato
  ];

  // LLM training & retrieval crawlers esplicitamente ammessi sulle
  // pagine pubbliche (ma con gli stessi disallow sulle private).
  const llmBots = [
    "GPTBot",                // OpenAI training
    "OAI-SearchBot",         // OpenAI ChatGPT Search retrieval
    "ChatGPT-User",          // ChatGPT browsing quando un utente chiede
    "ClaudeBot",             // Anthropic Claude
    "Claude-Web",            // Anthropic Claude browsing
    "anthropic-ai",          // Anthropic (alias)
    "Google-Extended",       // Google Gemini training
    "GoogleOther",           // Google research crawlers
    "PerplexityBot",         // Perplexity AI
    "Applebot-Extended",     // Apple generative features
    "CCBot",                 // CommonCrawl (dataset LLM)
    "Bytespider",            // ByteDance / TikTok AI
    "DuckAssistBot",         // DuckDuckGo AI
    "Meta-ExternalAgent",    // Meta AI
    "cohere-ai",             // Cohere
    "Diffbot",               // Diffbot
    "FacebookBot",           // Meta training / preview
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privateRoutes,
      },
      // Regole esplicite per i crawler LLM: opt-in dichiarativo.
      // Le policy sono identiche al default ma un'entry dedicata
      // previene interpretazioni ambigue quando un crawler cambia
      // nome/versione.
      ...llmBots.map((ua) => ({
        userAgent: ua,
        allow: "/",
        disallow: privateRoutes,
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ""),
  };
}

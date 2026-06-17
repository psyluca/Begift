import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin();

/**
 * Content-Security-Policy per BeGift.
 *
 * Obiettivo: limitare l'esecuzione di script non controllati e l'injection
 * di risorse esterne, pur permettendo il funzionamento del dominio principale
 * e dei sub-processori dichiarati nella privacy policy.
 *
 * Note sulle scelte:
 * - `script-src 'unsafe-inline'` e' attualmente necessario per alcuni
 *   inline handlers lasciati da iterazioni passate + JSON-LD embedded nelle
 *   pagine SEO. Piano: introdurre nonce in Fase 2 di hardening, poi rimuovere
 *   'unsafe-inline'. Rilevanza: ridurre la superficie di XSS riuscita.
 * - `connect-src` include supabase.co (REST+Realtime+Storage), anthropic
 *   non serve perche' gli endpoint AI sono chiamati solo server-side.
 * - `img-src data:` serve per SVG inline e placeholder b64 del service worker.
 * - `frame-ancestors 'none'` blocca clickjacking (non usiamo iframe di terzi).
 * - `form-action 'self'` blocca form che postano su domini terzi.
 * - `upgrade-insecure-requests` forza il browser a non richiedere HTTP.
 */
const CSP = [
  "default-src 'self'",
  // Plausible Analytics: script servito da plausible.io.
  // Le chiamate di ingestione eventi vanno in connect-src (vedi sotto).
`script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval' " : ''}https://plausible.io`,
  // fonts.googleapis.com serve per i fogli di stile di Google Fonts
  // (es. font Caveat caricato in alcune pagine). Senza, il CSP blocca
  // il <link rel="stylesheet"> verso fonts.googleapis.com.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // img-src include i.ytimg.com per thumbnails YouTube nei link gift.
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://i.ytimg.com https://*.ytimg.com https://i.scdn.co",
  // media-src include p.scdn.co per i preview audio 30s di Spotify
  // (SongPicker → /api/spotify/search ritorna previewUrl che punta a
  // p.scdn.co/mp3-preview/...). Senza, il tag <audio> verrebbe bloccato
  // dal CSP e gli utenti vedrebbero un player muto.
  "media-src 'self' blob: https://*.supabase.co https://p.scdn.co",
  // fonts.gstatic.com e' il CDN da cui Google Fonts serve i file .woff2.
  // Va in coppia con fonts.googleapis.com in style-src.
  "font-src 'self' data: https://fonts.gstatic.com",
  // connect-src include plausible.io per il POST /api/event degli eventi custom.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://plausible.io",
  // frame-src: domini consentiti per <iframe> embed dentro i regali.
  // Senza questa direttiva, fallback a default-src 'self' bloccava
  // gli embed YouTube/Spotify/Vimeo (bug riportato 2026-04-25).
  // supabase.co aggiunto 2026-05-18 per anteprima inline PDF coupon
  // (BeGift Business): senza, l'iframe veniva bloccato in silenzio.
  "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://open.spotify.com https://player.vimeo.com https://player.twitch.tv https://w.soundcloud.com https://*.supabase.co",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Security headers applicati globalmente.
 * - Strict-Transport-Security: 2 anni + subdomains + preload.
 *   Inviare poi begift.app a https://hstspreload.org per inclusione
 *   nella preload list (azione manuale una tantum, gap 16.2).
 * - X-Content-Type-Options: nosniff impedisce MIME-type sniffing dei browser.
 * - X-Frame-Options: SAMEORIGIN doppia difesa vs clickjacking (oltre a CSP).
 * - Referrer-Policy: strict-origin-when-cross-origin limita leak URL a terzi.
 * - Permissions-Policy: disabilita sensori/device che non usiamo, riduce
 *   l'attack surface di eventuali dipendenze compromesse.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  async headers() {
    return [
      {
        // Applichiamo i security headers a tutte le rotte, inclusa
        // la home. Le eccezioni eventuali (es. embed widget futuri)
        // saranno aggiunte qui con matcher specifici.
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // security.txt deve essere servito come testo semplice (RFC 9116).
        source: "/.well-known/security.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
    ];
  },
  /**
   * Redirect 301 per consolidare URL canoniche e ripulire pagine SEO
   * programmatiche (thin content) ora sostituite da occasion-page long-form.
   *
   * Background (2026-06-03):
   * Google Search Console mostrava 25 pagine "Rilevate ma non indicizzate"
   * — segnale di low quality complessivo del dominio. Tra queste, le pagine
   * /regali-per/[occasion] e /regali-a/[city] erano landing SEO con poco
   * contenuto, ora rese ridondanti dalle 4 occasion-page long-form
   * (/laurea, /matrimonio, /compleanno, /anniversario).
   *
   * Strategia: redirect 301 verso la URL canonica (preserva eventuali
   * backlink residui, consolida link equity, segnala a Google che il
   * vecchio URL è obsoleto e non va più indicizzato).
   *
   * Nota: il file dinamico app/regali-per/[occasion]/page.tsx e
   * app/regali-a/[city]/page.tsx restano in repo come fallback ma non
   * vengono mai raggiunti perché il redirect è valutato PRIMA del routing
   * Next.js.
   */
  async redirects() {
    return [
      // /regali-per/[occasion] → occasion-page canonica
      { source: "/regali-per/anniversario", destination: "/anniversario", permanent: true },
      { source: "/regali-per/compleanno",   destination: "/compleanno",   permanent: true },
      { source: "/regali-per/laurea",       destination: "/laurea",       permanent: true },
      { source: "/regali-per/festa-mamma",  destination: "/festa-mamma",  permanent: true },
      { source: "/regali-per/festa-papa",   destination: "/festa-papa",   permanent: true },
      // varianti senza canonico diretto → hub /regalo
      { source: "/regali-per/coppia",  destination: "/regalo", permanent: true },
      { source: "/regali-per/amici",   destination: "/regalo", permanent: true },
      { source: "/regali-per/foodie",  destination: "/regalo", permanent: true },
      // catch-all per future varianti /regali-per/X
      { source: "/regali-per/:slug",   destination: "/regalo", permanent: true },

      // /regali-a/[city] → catalogo (no canonico per-città attualmente)
      { source: "/regali-a/:city",     destination: "/regalo/catalogo", permanent: true },

      // /start era vecchio intent picker, ora flusso unificato in /regalo
      { source: "/start",              destination: "/regalo", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);

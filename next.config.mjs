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
  "script-src 'self' 'unsafe-inline' https://plausible.io",
  "style-src 'self' 'unsafe-inline'",
  // img-src include i.ytimg.com per thumbnails YouTube nei link gift.
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://i.ytimg.com https://*.ytimg.com https://i.scdn.co",
  "media-src 'self' blob: https://*.supabase.co",
  "font-src 'self' data:",
  // connect-src include plausible.io per il POST /api/event degli eventi custom.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://plausible.io",
  // frame-src: domini consentiti per <iframe> embed dentro i regali.
  // Senza questa direttiva, fallback a default-src 'self' bloccava
  // gli embed YouTube/Spotify/Vimeo (bug riportato 2026-04-25).
  "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://open.spotify.com https://player.vimeo.com https://player.twitch.tv https://w.soundcloud.com",
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
};

export default withNextIntl(nextConfig);

/**
 * GET /api/img-proxy?u=<encoded_image_url>
 *
 * Proxy server-side per immagini esterne (GYG CDN, VVT, ecc.).
 *
 * Perche': GetYourGuide, VivaTicket e molti altri CDN bloccano
 * l'hotlinking — un browser su begift.app che chiede direttamente
 * cdn.getyourguide.com/...jpg riceve 403 perche' il Referer non
 * matcha. Facendo fetch lato server (dove non c'e' un Referer
 * problematico) le immagini si caricano.
 *
 * Sicurezza — NON deve diventare open proxy generico:
 *   - Whitelist di hostname suffix consentiti (vedi ALLOWED_HOST_SUFFIXES)
 *   - URL parsato e validato (must be http/https, no localhost,
 *     no 127.x, no privati)
 *   - Content-Type deve iniziare con image/
 *   - Max 10 MB
 *   - Timeout 8 secondi
 *
 * Caching:
 *   - Cache-Control: public, max-age=3600, s-maxage=86400
 *     1h sul browser, 1g sul CDN Vercel. Quando un'immagine cambia
 *     URL (raro per asset CDN) basta riavviare con cache busted.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Suffix domini consentiti. Match flessibile (es. 'getyourguide.com'
// matcha 'cdn.getyourguide.com', 'images.getyourguide.com', etc).
// Aggiungere qui nuovi partner CDN al momento di onboardarli.
const ALLOWED_HOST_SUFFIXES = [
  "getyourguide.com",
  "gyg.com",
  "vivaticket.com",
  "vivaticket.it",
  "awin1.com",
  "awinmid.com",
  "ticketmaster.it",
  "ticketmaster.com",
  "ticketone.it",
  // partner futuri da aggiungere qui (24bottles.com, ecc.)
];

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB safety
const FETCH_TIMEOUT_MS = 8000;

function isHostAllowed(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  for (const suffix of ALLOWED_HOST_SUFFIXES) {
    if (lower === suffix || lower.endsWith("." + suffix)) return true;
  }
  return false;
}

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost") return true;
  if (lower === "0.0.0.0") return true;
  if (lower.startsWith("127.")) return true;
  if (lower.startsWith("10.")) return true;
  if (lower.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(lower)) return true;
  if (lower.startsWith("169.254.")) return true; // link-local
  if (lower.endsWith(".local")) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get("u");
  if (!raw) {
    return NextResponse.json({ error: "missing_u_param" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return NextResponse.json({ error: "invalid_protocol" }, { status: 400 });
  }
  if (isPrivateHost(target.hostname)) {
    return NextResponse.json({ error: "private_host_blocked" }, { status: 403 });
  }
  if (!isHostAllowed(target.hostname)) {
    return NextResponse.json(
      {
        error: "host_not_whitelisted",
        host: target.hostname,
        hint: "Add host suffix to ALLOWED_HOST_SUFFIXES in app/api/img-proxy/route.ts",
      },
      { status: 403 }
    );
  }

  // Fetch lato server con timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      method: "GET",
      // Header minimi — niente Referer "begift.app" che e' il problema.
      // User-Agent generico, alcuni CDN richiedono qualcosa di non vuoto.
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5",
        "User-Agent": "Mozilla/5.0 (BeGift image-proxy)",
      },
      signal: controller.signal,
      // No cookies, no credentials cross-origin
      cache: "no-store",
      redirect: "follow",
    });
  } catch (e) {
    clearTimeout(timer);
    return NextResponse.json(
      { error: "upstream_fetch_failed", message: (e as Error).message },
      { status: 502 }
    );
  }
  clearTimeout(timer);

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "upstream_http", status: upstream.status },
      { status: upstream.status === 404 ? 404 : 502 }
    );
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json(
      { error: "not_an_image", content_type: contentType },
      { status: 415 }
    );
  }

  // Stream the body but cap size for safety
  const ab = await upstream.arrayBuffer();
  if (ab.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { error: "image_too_large", bytes: ab.byteLength, max: MAX_BYTES },
      { status: 413 }
    );
  }

  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // 1h client, 1g CDN. Permette refresh ragionevole se l'immagine
      // upstream cambia (raro per asset CDN GYG).
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "X-Image-Proxy": "begift",
    },
  });
}

/**
 * Estrazione URL immagini dal body HTML di una mail di conferma.
 *
 * Le mail di Booking, TicketOne, Smartbox, GetYourGuide ecc. contengono
 * tipicamente la FOTO REALE del posto/evento (hotel photo, locandina
 * concerto, immagine del cofanetto) embedded come <img> nell'HTML.
 * Estrarla qui evita di doverla cercare con API esterne tipo Unsplash.
 *
 * Strategia:
 *  1. Regex su `<img>` per catturare src, alt, width, height
 *  2. Filtra fuori: tracking pixels (1x1), spacer, beacon, footer icons,
 *     loghi piccoli (< 200x200), CDN di tracciamento note
 *  3. Restituisce array ordinato (immagini grandi/contenuto prima)
 *
 * Limiti noti:
 *  - Non funziona se la mail e' solo text/plain (es. notifiche minimal)
 *  - Alcune mail mettono la foto in CSS background-image (non coperto)
 *  - Per i concerti TicketOne spesso c'e' solo il logo TicketOne, non
 *    la foto del cantante — in quei casi servira' un fallback (Spotify,
 *    YouTube, query Unsplash).
 */

interface ExtractedImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  /** Score euristico (piu' alto = piu' probabile sia l'immagine "hero") */
  score: number;
}

// Pattern URL chiaramente NON contenuto (tracker, pixel, footer icons)
const URL_BLACKLIST_PATTERNS = [
  /\/pixel/i,
  /\/track/i,
  /\/beacon/i,
  /\/open\?/i,
  /1x1/,
  /\/spacer/i,
  /transparent\.gif/i,
  /\/logo[/_-]?(small|tiny|footer|email)/i,
  // domini di pure tracking
  /list-manage\.com/i,
  /mailchimpapp\.com/i,
  /sendgrid\.net\/wf/i,
  /click\.[a-z]+\.com\/track/i,
];

// Dominii CDN noti di immagini "contenuto" (boost score)
const CONTENT_CDN_BOOST: RegExp[] = [
  /bstatic\.com/i,       // Booking.com hotel photos
  /cf\.bstatic\.com/i,
  /smartbox/i,
  /wonderbox/i,
  /ticketone\.it.*\/eventi/i,
  /vivaticket/i,
  /getyourguide/i,
  /trenitalia.*\/destinazion/i,
  /img\./i,              // generic img.* subdomains
];

/** Estrae le immagini "candidate" dal body HTML, ordinate per qualità. */
export function extractImagesFromHtml(html: string): ExtractedImage[] {
  if (!html || typeof html !== "string") return [];

  const images: ExtractedImage[] = [];
  // Match <img ...> con eventuali attributi (case-insensitive, multiline)
  const imgRegex = /<img\b[^>]*>/gi;
  const matches = html.match(imgRegex) || [];

  for (const tag of matches) {
    const src = extractAttr(tag, "src");
    if (!src) continue;

    // Solo URL http(s)
    if (!/^https?:\/\//i.test(src)) continue;

    // Blacklist URL
    if (URL_BLACKLIST_PATTERNS.some((re) => re.test(src))) continue;

    const alt = extractAttr(tag, "alt") || undefined;
    const w = parseDim(extractAttr(tag, "width"));
    const h = parseDim(extractAttr(tag, "height"));

    // Tracking pixel: se entrambe dimensioni sono dichiarate piccolissime
    if (w !== undefined && h !== undefined && w <= 5 && h <= 5) continue;

    // Score: piu' grande = meglio. Boost se URL e' su un CDN contenuto noto.
    let score = 0;
    if (w !== undefined) score += w;
    if (h !== undefined) score += h;
    if (w === undefined && h === undefined) score += 200; // benefit of doubt
    if (CONTENT_CDN_BOOST.some((re) => re.test(src))) score += 1000;
    // Penalty per estensioni "icona/logo"
    if (/(favicon|sprite|logo|icon)/i.test(src)) score -= 300;
    // Penalty pesante per file .gif (quasi sempre tracker o emoticon)
    if (/\.gif(\?|$)/i.test(src)) score -= 500;

    images.push({ url: src, alt, width: w, height: h, score });
  }

  // Ordina per score discendente, deduplica per URL
  const seen = new Set<string>();
  const sorted = images
    .sort((a, b) => b.score - a.score)
    .filter((img) => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });

  // Scarta quelle a score nettamente negativo
  return sorted.filter((img) => img.score > -200);
}

/** Estrai i primi N URL immagine "buoni" (helper per usi semplici). */
export function pickHeroImages(html: string, n = 3): string[] {
  return extractImagesFromHtml(html)
    .slice(0, n)
    .map((img) => img.url);
}

function extractAttr(tag: string, attr: string): string | null {
  // Cerca attr="..." o attr='...' (case-insensitive)
  const re = new RegExp(`\\b${attr}\\s*=\\s*["']([^"']*)["']`, "i");
  const m = tag.match(re);
  return m ? m[1] : null;
}

function parseDim(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
}

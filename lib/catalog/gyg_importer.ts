/**
 * GetYourGuide Partner API importer.
 *
 * Scarica il catalogo GYG attraverso la Partner API ufficiale e fa upsert
 * nelle righe `experiences` con source='imported_gyg_api'.
 *
 * Le righe importate convivono con quelle manuali (Vasco Live, Milan-Juventus,
 * Coldplay, ecc.) — le 'manual' vincono in conflitto perche' l'upsert filtra
 * per source='imported_gyg_api'.
 *
 * Auth GYG: API key in header X-ACCESS-TOKEN (vedi env GYG_PARTNER_API_KEY).
 * Per ottenerla:
 *   1. Login al partner portal https://supplier.getyourguide.com
 *   2. Sezione "Connectivity → Partner API"
 *   3. (Se non disponibile) richiedi accesso scrivendo a
 *      partner-api@getyourguide.com con descrizione caso d'uso
 *
 * Strategia:
 *   - Paginazione: offset 0, +100 per pagina, max MAX_PAGES (safety).
 *   - Filtri client-side: rating>=4.0, reviews>=50 (popolarita').
 *   - Dedup: ON CONFLICT (external_id) DO UPDATE solo se import_hash cambia.
 *   - Audit: ogni run crea una riga in catalog_sync_runs con stats finali.
 *
 * Mock mode: se GYG_PARTNER_API_KEY non e' settata, l'importer ritorna
 * mock data (10 tour finti) per testare la pipeline E2E senza credenziali.
 *
 * NOTA shape API: la struttura JSON usata qui rispecchia la documentazione
 * pubblica della Partner API (https://partner-api.getyourguide.com).
 * Al primo run reale potrebbe servire un piccolo aggiustamento se il
 * formato risponde leggermente diverso. Il parser e' difensivo (campi
 * opzionali) e logga il primo record per facilitare il debug.
 */

import crypto from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { ExperienceCategory, ExperienceTag } from "@/types/experiences";

// ───────────────────────────────────────────────────────────────
// Tipi pubblici
// ───────────────────────────────────────────────────────────────

export interface GygImportOptions {
  /** API key GYG. Se assente o vuota → mock mode. */
  apiKey?: string;
  /** Soglia minima rating (default 4.0). */
  minRating?: number;
  /** Soglia minima recensioni (default 50). */
  minReviews?: number;
  /** Quante pagine max scaricare (default 30 = ~3000 tour). */
  maxPages?: number;
  /** Lista countries ISO da includere (default: tutti). */
  countries?: string[];
  /** Solo simulazione: nessun write su DB. */
  dryRun?: boolean;
  /** Callback per log strutturato. */
  log?: (level: "info" | "warn" | "error", msg: string, ctx?: object) => void;
}

export interface GygImportStats {
  fetched: number;
  filtered: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  duration_ms: number;
  pages: number;
  partner_id: string | null;
  mock_mode: boolean;
}

// ───────────────────────────────────────────────────────────────
// Shape API GYG (versione difensiva, tutti i campi opzionali)
// ───────────────────────────────────────────────────────────────

interface GygTour {
  id?: number | string;
  title?: string;
  abstract?: string;
  description?: string;
  url?: string;
  photo_url?: string;
  photos?: Array<{ url?: string; size?: string }>;
  city?: { id?: number; name?: string };
  country?: { code?: string; name?: string };
  price?: { amount?: number; currency?: string; formatted?: string };
  durations?: Array<{ duration?: number; unit?: string }>;
  rating?: number;
  reviews?: { count?: number; average?: number };
  reviews_count?: number;
  categories?: Array<{ id?: number; name?: string; slug?: string }>;
  tags?: string[];
}

interface GygSearchResponse {
  data?: GygTour[];
  tours?: GygTour[]; // alcuni endpoint usano "tours"
  total?: number;
  count?: number;
  paging?: { offset?: number; limit?: number; total?: number };
}

// ───────────────────────────────────────────────────────────────
// Mapping GYG → schema BeGift
// ───────────────────────────────────────────────────────────────

const GYG_CATEGORY_MAP: Record<string, ExperienceCategory> = {
  "tours": "culture",
  "city-tours": "culture",
  "walking-tours": "culture",
  "art-and-culture": "culture",
  "museums": "culture",
  "history": "culture",
  "food-and-drink": "food",
  "food-tours": "food",
  "wine-tasting": "food",
  "cooking-classes": "food",
  "outdoor-activities": "outdoor",
  "outdoor": "outdoor",
  "hiking": "outdoor",
  "water-sports": "outdoor",
  "adventure": "outdoor",
  "wellness": "wellness",
  "spa": "wellness",
  "transportation": "travel",
  "day-trips": "travel",
  "multi-day-trips": "travel",
  "concerts": "music",
  "concerts-shows": "show",
  "theater": "show",
  "shows": "show",
  "sports": "sport",
  "football": "sport",
};

const GYG_TAG_INFERENCE: Array<{ keywords: RegExp; tag: ExperienceTag }> = [
  { keywords: /\b(romantic|sunset|couple|two)\b/i, tag: "romantic" },
  { keywords: /\b(family|kids|child)\b/i, tag: "family" },
  { keywords: /\b(food|wine|cooking|dinner|lunch)\b/i, tag: "foodie" },
  { keywords: /\b(art|museum|gallery)\b/i, tag: "art" },
  { keywords: /\b(history|historical|ancient)\b/i, tag: "history" },
  { keywords: /\b(hike|hiking|trek)\b/i, tag: "hiking" },
  { keywords: /\b(beach|sea|boat|kayak)\b/i, tag: "sea" },
  { keywords: /\b(mountain|alps|dolomit)\b/i, tag: "mountains" },
  { keywords: /\b(photo|photograph)\b/i, tag: "photography" },
  { keywords: /\b(must|iconic|top|best)\b/i, tag: "must-see" },
];

function mapCategory(t: GygTour): ExperienceCategory {
  const slugs = (t.categories || [])
    .map((c) => c.slug || c.name?.toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean) as string[];
  for (const s of slugs) {
    if (GYG_CATEGORY_MAP[s]) return GYG_CATEGORY_MAP[s];
  }
  // Fallback: prova a inferire dal titolo
  const titleLow = (t.title || "").toLowerCase();
  if (/food|wine|cooking|tasting/i.test(titleLow)) return "food";
  if (/spa|wellness|yoga|massage/i.test(titleLow)) return "wellness";
  if (/concert|music|festival/i.test(titleLow)) return "music";
  if (/theater|opera|musical|show/i.test(titleLow)) return "show";
  if (/match|football|stadium/i.test(titleLow)) return "sport";
  if (/hike|trek|kayak|outdoor/i.test(titleLow)) return "outdoor";
  return "culture"; // default safe
}

function inferTags(t: GygTour): ExperienceTag[] {
  const text = [t.title, t.abstract, t.description, ...(t.tags || [])]
    .filter(Boolean)
    .join(" ");
  const inferred = new Set<ExperienceTag>();
  for (const { keywords, tag } of GYG_TAG_INFERENCE) {
    if (keywords.test(text)) inferred.add(tag);
  }
  // Aggiungi tag "international" come default per esperienze GYG
  // (sono prevalentemente brand globale e localizzate)
  inferred.add("international");
  return Array.from(inferred);
}

function extractImageUrl(t: GygTour): string | null {
  if (t.photo_url) return t.photo_url;
  if (t.photos && t.photos.length) {
    // Preferisci size "large" o "medium" se disponibile
    const preferred =
      t.photos.find((p) => p.size === "large") ||
      t.photos.find((p) => p.size === "medium") ||
      t.photos[0];
    return preferred?.url || null;
  }
  return null;
}

function buildAffiliateTemplate(tourId: string, gygUrl: string | null): string {
  // GYG ha due modi standard per il deeplink affiliate:
  //   1. Param ?partner_id={pid} sul URL canonico GYG
  //   2. Cread URL via Awin (awinmid GYG = 18715)
  // Manteniamo entrambi: param diretto se URL noto, altrimenti Awin fallback.
  const partnerIdPlaceholder = "{gyg_partner_id}";
  const clickrefPlaceholder = "{gift_id}";

  if (gygUrl) {
    const sep = gygUrl.includes("?") ? "&" : "?";
    return `${gygUrl}${sep}partner_id=${partnerIdPlaceholder}&cmp=${clickrefPlaceholder}`;
  }
  // Fallback Awin cread (mid GYG canonical)
  return (
    `https://www.awin1.com/cread.php?awinmid=18715` +
    `&awinaffid={affiliate_id}` +
    `&clickref=${clickrefPlaceholder}` +
    `&ued=${encodeURIComponent(`https://www.getyourguide.com/-l-${tourId}/`)}`
  );
}

function makeImportHash(input: {
  title: string;
  price_min_cents: number | null;
  city: string | null;
  image_url: string | null;
}): string {
  return crypto
    .createHash("sha256")
    .update(
      [
        input.title || "",
        String(input.price_min_cents ?? ""),
        input.city || "",
        input.image_url || "",
      ].join("|")
    )
    .digest("hex");
}

// ───────────────────────────────────────────────────────────────
// HTTP client GYG
// ───────────────────────────────────────────────────────────────

const GYG_API_BASE = process.env.GYG_API_BASE || "https://api.getyourguide.com";

async function fetchPage(
  apiKey: string,
  offset: number,
  limit: number,
  log: NonNullable<GygImportOptions["log"]>
): Promise<GygTour[]> {
  // Endpoint Partner API search. Param exatti possono variare per versione
  // (v1 vs v2). Usiamo v2 come default per coerenza con la doc piu' recente.
  const url = new URL(`${GYG_API_BASE}/2/tours`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", "popularity");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-ACCESS-TOKEN": apiKey,
      "Accept": "application/json",
      "Accept-Language": "it",
      "User-Agent": "BeGift-catalog-importer/1.0",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    log("error", `GYG API ${res.status} ${res.statusText}`, {
      url: url.toString(),
      body: body.slice(0, 500),
    });
    throw new Error(`GYG API HTTP ${res.status}`);
  }

  const json = (await res.json()) as GygSearchResponse;
  return json.data || json.tours || [];
}

// ───────────────────────────────────────────────────────────────
// Mock data per development senza API key
// ───────────────────────────────────────────────────────────────

function mockTours(): GygTour[] {
  return [
    {
      id: 12345,
      title: "Colosseo: tour guidato salta-fila",
      abstract: "Visita il Colosseo con guida esperta, accesso prioritario.",
      url: "https://www.getyourguide.com/colosseum-l201/colosseum-skip-the-line-t12345/",
      photo_url: "https://cdn.getyourguide.com/img/tour/colosseum.jpg",
      city: { name: "Rome" },
      country: { code: "IT" },
      price: { amount: 45, currency: "EUR" },
      rating: 4.7,
      reviews: { count: 12450 },
      categories: [{ slug: "city-tours" }, { slug: "history" }],
    },
    {
      id: 23456,
      title: "Tuscany Wine Tour da Firenze",
      abstract: "Vigneti, degustazione vini e cena tradizionale toscana.",
      url: "https://www.getyourguide.com/florence-l36/tuscany-wine-tour-t23456/",
      photo_url: "https://cdn.getyourguide.com/img/tour/tuscany-wine.jpg",
      city: { name: "Florence" },
      country: { code: "IT" },
      price: { amount: 89, currency: "EUR" },
      rating: 4.8,
      reviews: { count: 3210 },
      categories: [{ slug: "food-and-drink" }, { slug: "wine-tasting" }],
    },
    {
      id: 34567,
      title: "Venice: gondola serale con musica dal vivo",
      abstract: "Gondola con cantante e fisarmonica al tramonto sui canali.",
      url: "https://www.getyourguide.com/venice-l35/serenata-gondola-t34567/",
      photo_url: "https://cdn.getyourguide.com/img/tour/gondola.jpg",
      city: { name: "Venice" },
      country: { code: "IT" },
      price: { amount: 55, currency: "EUR" },
      rating: 4.5,
      reviews: { count: 890 },
      categories: [{ slug: "city-tours" }],
    },
  ];
}

// ───────────────────────────────────────────────────────────────
// Main entrypoint
// ───────────────────────────────────────────────────────────────

export async function importFromGyg(
  opts: GygImportOptions = {}
): Promise<GygImportStats> {
  const startTs = Date.now();
  const log = opts.log || (() => {});
  const minRating = opts.minRating ?? 4.0;
  const minReviews = opts.minReviews ?? 50;
  const maxPages = opts.maxPages ?? 30;
  const apiKey = opts.apiKey || process.env.GYG_PARTNER_API_KEY || "";
  const mockMode = !apiKey;

  const stats: GygImportStats = {
    fetched: 0,
    filtered: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    duration_ms: 0,
    pages: 0,
    partner_id: null,
    mock_mode: mockMode,
  };

  log("info", `Import start (mock_mode=${mockMode})`, {
    minRating,
    minReviews,
    maxPages,
  });

  const admin = createSupabaseAdmin();

  // 1. Recupera partner_id GYG
  const { data: partner, error: partnerErr } = await admin
    .from("experience_partners")
    .select("id")
    .eq("slug", "getyourguide")
    .maybeSingle();

  if (partnerErr || !partner) {
    log("error", "Partner 'getyourguide' non trovato in experience_partners", {
      err: partnerErr?.message,
    });
    stats.errors += 1;
    stats.duration_ms = Date.now() - startTs;
    return stats;
  }
  stats.partner_id = partner.id;

  // 2. Fetch pagine
  const allTours: GygTour[] = [];
  if (mockMode) {
    allTours.push(...mockTours());
    stats.pages = 1;
    log("warn", "Running in MOCK mode (no API key). 3 finti tour caricati.");
  } else {
    for (let page = 0; page < maxPages; page += 1) {
      const offset = page * 100;
      try {
        const tours = await fetchPage(apiKey, offset, 100, log);
        stats.pages = page + 1;
        if (page === 0 && tours[0]) {
          log("info", "First GYG record (per debug shape)", { sample: tours[0] });
        }
        if (tours.length === 0) break;
        allTours.push(...tours);
        if (tours.length < 100) break; // ultima pagina
      } catch (e) {
        log("error", "Page fetch failed, abort import", {
          page,
          err: (e as Error).message,
        });
        stats.errors += 1;
        stats.duration_ms = Date.now() - startTs;
        return stats;
      }
    }
  }
  stats.fetched = allTours.length;

  // 3. Filtra per popolarita' + countries
  const countries = opts.countries?.map((c) => c.toUpperCase());
  const filtered = allTours.filter((t) => {
    const rating = t.rating ?? t.reviews?.average ?? 0;
    const reviews = t.reviews?.count ?? t.reviews_count ?? 0;
    if (rating < minRating) return false;
    if (reviews < minReviews) return false;
    if (countries && countries.length) {
      const code = t.country?.code?.toUpperCase();
      if (!code || !countries.includes(code)) return false;
    }
    return true;
  });
  stats.filtered = filtered.length;
  log("info", `Filtered ${filtered.length}/${allTours.length} tours pass quality bar`);

  // 4. Upsert in batch
  for (const t of filtered) {
    try {
      const externalId = t.id != null ? String(t.id) : null;
      if (!externalId || !t.title) {
        stats.skipped += 1;
        continue;
      }

      const priceMinCents =
        t.price?.amount != null ? Math.round(t.price.amount * 100) : null;
      const city = t.city?.name || null;
      const country = (t.country?.code || "IT").toUpperCase();
      const imageUrl = extractImageUrl(t);
      const importHash = makeImportHash({
        title: t.title,
        price_min_cents: priceMinCents,
        city,
        image_url: imageUrl,
      });

      // Check se esiste gia' la riga con stesso external_id
      const { data: existing } = await admin
        .from("experiences")
        .select("id, source, import_hash")
        .eq("external_id", externalId)
        .maybeSingle();

      if (existing) {
        // Mai sovrascrivere righe manuali (curatela)
        if (existing.source === "manual") {
          stats.skipped += 1;
          continue;
        }
        // Skip se hash invariato (no-op update)
        if (existing.import_hash === importHash) {
          stats.skipped += 1;
          continue;
        }
        if (opts.dryRun) {
          stats.updated += 1;
          continue;
        }
        const { error: updErr } = await admin
          .from("experiences")
          .update({
            title: t.title,
            description: t.description || t.abstract || null,
            image_url: imageUrl,
            external_url: t.url || null,
            city,
            country,
            category: mapCategory(t),
            tags: inferTags(t),
            price_min_cents: priceMinCents,
            currency: t.price?.currency || "EUR",
            rating: t.rating ?? t.reviews?.average ?? null,
            reviews_count: t.reviews?.count ?? t.reviews_count ?? 0,
            affiliate_url_template: buildAffiliateTemplate(externalId, t.url || null),
            import_hash: importHash,
            last_synced_at: new Date().toISOString(),
            active: true,
          })
          .eq("id", existing.id);
        if (updErr) {
          log("warn", "Update failed", { externalId, err: updErr.message });
          stats.errors += 1;
        } else {
          stats.updated += 1;
        }
      } else {
        if (opts.dryRun) {
          stats.inserted += 1;
          continue;
        }
        const { error: insErr } = await admin.from("experiences").insert({
          partner_id: stats.partner_id,
          external_id: externalId,
          external_url: t.url || null,
          title: t.title,
          description: t.description || t.abstract || null,
          image_url: imageUrl,
          city,
          country,
          category: mapCategory(t),
          tags: inferTags(t),
          price_min_cents: priceMinCents,
          currency: t.price?.currency || "EUR",
          rating: t.rating ?? t.reviews?.average ?? null,
          reviews_count: t.reviews?.count ?? t.reviews_count ?? 0,
          affiliate_url_template: buildAffiliateTemplate(externalId, t.url || null),
          source: "imported_gyg_api",
          import_hash: importHash,
          last_synced_at: new Date().toISOString(),
          active: true,
        });
        if (insErr) {
          log("warn", "Insert failed", { externalId, err: insErr.message });
          stats.errors += 1;
        } else {
          stats.inserted += 1;
        }
      }
    } catch (e) {
      log("error", "Per-record exception", {
        externalId: t.id,
        err: (e as Error).message,
      });
      stats.errors += 1;
    }
  }

  stats.duration_ms = Date.now() - startTs;
  log("info", "Import complete", { ...stats });
  return stats;
}

/**
 * Wrapper che crea anche la riga di audit in catalog_sync_runs.
 */
export async function runImportWithAudit(
  trigger: "cron" | "manual" | "api",
  opts: GygImportOptions = {},
  triggeredBy: string | null = null
): Promise<{ run_id: string; stats: GygImportStats }> {
  const admin = createSupabaseAdmin();

  const { data: run, error: runErr } = await admin
    .from("catalog_sync_runs")
    .insert({
      source: "gyg_api",
      trigger,
      triggered_by: triggeredBy,
      status: "running",
    })
    .select("id")
    .single();

  if (runErr || !run) {
    throw new Error(`Cannot create sync_run audit row: ${runErr?.message}`);
  }

  const logBuffer: object[] = [];
  const log: NonNullable<GygImportOptions["log"]> = (level, msg, ctx) => {
    logBuffer.push({ level, msg, ctx, t: new Date().toISOString() });
    // eslint-disable-next-line no-console
    console.log(`[gyg-import][${level}] ${msg}`, ctx || "");
  };

  let stats: GygImportStats;
  try {
    stats = await importFromGyg({ ...opts, log });
    const finalStatus =
      stats.errors > 0
        ? stats.errors === stats.fetched
          ? "error"
          : "partial"
        : "success";
    await admin
      .from("catalog_sync_runs")
      .update({
        status: finalStatus,
        finished_at: new Date().toISOString(),
        fetched: stats.fetched,
        filtered: stats.filtered,
        inserted: stats.inserted,
        updated: stats.updated,
        skipped: stats.skipped,
        errors: stats.errors,
        duration_ms: stats.duration_ms,
        notes: {
          pages: stats.pages,
          mock_mode: stats.mock_mode,
          log: logBuffer.slice(-30), // ultimi 30 eventi per debug
        },
      })
      .eq("id", run.id);
    return { run_id: run.id, stats };
  } catch (e) {
    await admin
      .from("catalog_sync_runs")
      .update({
        status: "error",
        finished_at: new Date().toISOString(),
        error_message: (e as Error).message,
        notes: { log: logBuffer.slice(-30) },
      })
      .eq("id", run.id);
    throw e;
  }
}

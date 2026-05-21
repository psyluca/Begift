/**
 * Awin Product Feed importer.
 *
 * Scarica un feed CSV Awin (formato standard publisher.awin.com) e fa
 * upsert nelle righe `experiences`. Usato attualmente per VivaTicket
 * (merchant ID 32283) ma il parser e' generico: configurando una entry
 * MERCHANTS{} qui sotto si puo' importare qualunque advertiser Awin.
 *
 * Formato feed Awin (CSV con header):
 *   - aw_deep_link            URL affiliate gia' tracciato
 *   - aw_product_id           ID univoco del prodotto sul publisher
 *   - merchant_product_id     ID interno del merchant (es. ID evento VVT)
 *   - product_name            titolo
 *   - description             descrizione (testo lungo)
 *   - aw_image_url            URL immagine
 *   - search_price            prezzo (decimale, virgola o punto)
 *   - currency                EUR
 *   - merchant_category       categoria merchant (es. "Concerti")
 *   - delivery_country        IT
 *   - in_stock                1 / 0
 *
 * Auth:
 *   AWIN_API_TOKEN env var (per fetchare il feed da Awin).
 *   Il publisher report di Awin elenca i feed disponibili in
 *   https://ui.awin.com/publisher/{publisherId}/datafeed → li' Luca
 *   genera l'URL feed di VVT (filtra per advertiser 32283).
 *
 * Mock mode: se MERCHANTS[slug].feedUrl non e' settato O AWIN_API_TOKEN
 * mancano, l'importer ritorna 3 eventi mock (Coldplay, Aida Verona,
 * Bologna FC) per testare la pipeline end-to-end.
 */

import crypto from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { ExperienceCategory, ExperienceTag } from "@/types/experiences";
import { parseCsv } from "@/lib/catalog/csv_parser";

// ───────────────────────────────────────────────────────────────
// Configurazione merchant Awin
// ───────────────────────────────────────────────────────────────

interface AwinMerchantConfig {
  /** Slug del partner in experience_partners (es. 'awin'). */
  partnerSlug: string;
  /** Merchant ID Awin. Per VVT = 32283. */
  awinmid: number;
  /** Env var che contiene l'URL feed Awin. */
  feedUrlEnv: string;
  /** Etichetta human-readable per i log. */
  displayName: string;
  /** Default category se il feed non specifica. */
  defaultCategory: ExperienceCategory;
  /** Country default per le righe del feed. */
  defaultCountry: string;
  /** Source tag salvato in experiences.source. */
  sourceTag: string;
}

/**
 * Catalogo merchant Awin gestiti. Aggiungere qui per supportare
 * altri advertiser (es. Booking, Booking.com Hotel, food&drink).
 */
export const AWIN_MERCHANTS: Record<string, AwinMerchantConfig> = {
  vivaticket: {
    partnerSlug: "awin",
    awinmid: 32283,
    feedUrlEnv: "AWIN_VVT_FEED_URL",
    displayName: "VivaTicket",
    defaultCategory: "show",
    defaultCountry: "IT",
    sourceTag: "imported_vvt_awin_feed",
  },
};

// ───────────────────────────────────────────────────────────────
// Tipi pubblici
// ───────────────────────────────────────────────────────────────

export interface AwinImportOptions {
  /** Slug del merchant (chiave di AWIN_MERCHANTS). */
  merchantSlug: string;
  /** Override URL feed (se non vuoi usare env var). */
  feedUrl?: string;
  /** Soglia prezzo minimo (default 1000 = €10, evita prodotti spurious). */
  minPriceCents?: number;
  /** Quanti record max processare (safety). Default 5000. */
  maxRecords?: number;
  /** Solo simulazione: nessun write su DB. */
  dryRun?: boolean;
  /** Callback per log strutturato. */
  log?: (level: "info" | "warn" | "error", msg: string, ctx?: object) => void;
}

export interface AwinImportStats {
  fetched: number;
  filtered: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  duration_ms: number;
  partner_id: string | null;
  mock_mode: boolean;
  merchant: string;
}

// ───────────────────────────────────────────────────────────────
// Mapping CSV → schema BeGift
// ───────────────────────────────────────────────────────────────

const CATEGORY_HINTS: Array<{ pattern: RegExp; cat: ExperienceCategory }> = [
  { pattern: /\b(concert|concerto|tour|music|musica|live|festival)\b/i, cat: "music" },
  { pattern: /\b(opera|musical|teatro|theatre|show|spettacolo|broadway)\b/i, cat: "show" },
  { pattern: /\b(calcio|football|partita|match|basket|tennis|sport|stadium|stadio)\b/i, cat: "sport" },
  { pattern: /\b(arte|art|museo|museum|mostra|exhibition|cultura|culture)\b/i, cat: "culture" },
  { pattern: /\b(food|cibo|cena|wine|vino|degustazione|tasting)\b/i, cat: "food" },
  { pattern: /\b(spa|wellness|relax|yoga|terme)\b/i, cat: "wellness" },
  { pattern: /\b(parco|park|adventure|outdoor|escursione|trekking)\b/i, cat: "outdoor" },
];

function inferCategory(
  productName: string,
  merchantCategory: string,
  fallback: ExperienceCategory
): ExperienceCategory {
  const haystack = `${productName} ${merchantCategory}`.toLowerCase();
  for (const { pattern, cat } of CATEGORY_HINTS) {
    if (pattern.test(haystack)) return cat;
  }
  return fallback;
}

const TAG_HINTS: Array<{ pattern: RegExp; tag: ExperienceTag }> = [
  { pattern: /\b(romantic|romantic|love|amor)\b/i, tag: "romantic" },
  { pattern: /\b(family|famiglia|kids|bambini)\b/i, tag: "family" },
  { pattern: /\b(couples|coppia|partner|due)\b/i, tag: "couples" },
  { pattern: /\b(must|iconico|imperdibile|top)\b/i, tag: "must-see" },
  { pattern: /\b(arena|stadium|stadio)\b/i, tag: "must-see" },
  { pattern: /\b(opera|musical|teatro)\b/i, tag: "art" },
  { pattern: /\b(notte|night|date)\b/i, tag: "date-night" },
];

function inferTags(text: string): ExperienceTag[] {
  const out = new Set<ExperienceTag>();
  for (const { pattern, tag } of TAG_HINTS) {
    if (pattern.test(text)) out.add(tag);
  }
  return Array.from(out);
}

function parsePriceCents(raw: string): number | null {
  if (!raw) return null;
  // Awin manda "29.50" o "29,50" o "29"
  const normalized = raw.replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = parseFloat(normalized);
  if (!isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function extractCity(productName: string, description: string): string | null {
  // Heuristica: cerca città italiane note nel titolo/descrizione
  const cities = [
    "Roma",
    "Milano",
    "Firenze",
    "Venezia",
    "Verona",
    "Napoli",
    "Bologna",
    "Lucca",
    "Torino",
    "Palermo",
    "Bari",
    "Salerno",
    "Genova",
    "Catania",
  ];
  const text = `${productName} ${description}`;
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, "i").test(text)) return c;
  }
  return null;
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
// HTTP fetch del feed
// ───────────────────────────────────────────────────────────────

async function fetchFeedCsv(
  url: string,
  log: NonNullable<AwinImportOptions["log"]>
): Promise<string> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/csv, application/octet-stream",
      "User-Agent": "BeGift-catalog-importer/1.0",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    log("error", `Awin feed HTTP ${res.status}`, {
      url: url.replace(/apikey\/[^/]+/, "apikey/REDACTED"),
      body: body.slice(0, 300),
    });
    throw new Error(`Awin feed HTTP ${res.status}`);
  }
  // I feed Awin sono spesso .gz; quando viene fornito un URL .csv non-gz
  // semplificato (es. format=csv senza compression) basta text(). Se il
  // feed restituisce gzip, l'agent HTTP di Node decompressa automaticamente
  // se Content-Encoding è gzip. Altrimenti il chiamante deve fornire un URL
  // che termini in .csv non compresso.
  return await res.text();
}

// ───────────────────────────────────────────────────────────────
// Mock data
// ───────────────────────────────────────────────────────────────

function mockRecords(merchant: AwinMerchantConfig): Record<string, string>[] {
  if (merchant.partnerSlug === "awin") {
    return [
      {
        aw_product_id: "mock-vvt-coldplay-milano",
        merchant_product_id: "32283-COLD-MIL",
        product_name: "Coldplay Music of the Spheres — Milano",
        description: "Concerto Coldplay allo Stadio San Siro di Milano.",
        aw_image_url: "https://cdn.vivaticket.it/concerts/coldplay-milan.jpg",
        aw_deep_link:
          "https://www.awin1.com/cread.php?awinmid=32283&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2Fconcert%2Fcoldplay-milan",
        search_price: "85.00",
        currency: "EUR",
        merchant_category: "Concerti",
        delivery_country: "IT",
        in_stock: "1",
      },
      {
        aw_product_id: "mock-vvt-aida-arena",
        merchant_product_id: "32283-AIDA-VR",
        product_name: "Aida — Arena di Verona",
        description: "Opera lirica all'Arena di Verona, stagione estiva.",
        aw_image_url: "https://cdn.vivaticket.it/opera/aida-arena.jpg",
        aw_deep_link:
          "https://www.awin1.com/cread.php?awinmid=32283&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2Fopera%2Faida",
        search_price: "65.00",
        currency: "EUR",
        merchant_category: "Opera",
        delivery_country: "IT",
        in_stock: "1",
      },
      {
        aw_product_id: "mock-vvt-bologna-fc",
        merchant_product_id: "32283-BOL-FC",
        product_name: "Bologna FC — partite casa",
        description: "Biglietti per le partite del Bologna allo stadio Dall'Ara.",
        aw_image_url: "https://cdn.vivaticket.it/sport/bologna-fc.jpg",
        aw_deep_link:
          "https://www.awin1.com/cread.php?awinmid=32283&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2Fsport%2Fbologna-fc",
        search_price: "32.00",
        currency: "EUR",
        merchant_category: "Sport",
        delivery_country: "IT",
        in_stock: "1",
      },
    ];
  }
  return [];
}

// ───────────────────────────────────────────────────────────────
// Main entrypoint
// ───────────────────────────────────────────────────────────────

export async function importFromAwinFeed(
  opts: AwinImportOptions
): Promise<AwinImportStats> {
  const startTs = Date.now();
  const log = opts.log || (() => {});
  const merchant = AWIN_MERCHANTS[opts.merchantSlug];

  if (!merchant) {
    throw new Error(`Unknown merchant slug: ${opts.merchantSlug}`);
  }

  const feedUrl =
    opts.feedUrl ||
    process.env[merchant.feedUrlEnv] ||
    "";
  const mockMode = !feedUrl;
  const minPriceCents = opts.minPriceCents ?? 1000;
  const maxRecords = opts.maxRecords ?? 5000;

  const stats: AwinImportStats = {
    fetched: 0,
    filtered: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    duration_ms: 0,
    partner_id: null,
    mock_mode: mockMode,
    merchant: merchant.partnerSlug,
  };

  log("info", `Import start [${merchant.displayName}] (mock=${mockMode})`, {
    feedUrlEnv: merchant.feedUrlEnv,
    minPriceCents,
    maxRecords,
  });

  const admin = createSupabaseAdmin();

  // 1. Recupera partner_id
  const { data: partner, error: partnerErr } = await admin
    .from("experience_partners")
    .select("id")
    .eq("slug", merchant.partnerSlug)
    .maybeSingle();

  if (partnerErr || !partner) {
    log("error", `Partner ${merchant.partnerSlug} non trovato`, {
      err: partnerErr?.message,
    });
    stats.errors += 1;
    stats.duration_ms = Date.now() - startTs;
    return stats;
  }
  stats.partner_id = partner.id;

  // 2. Carica records (CSV reale o mock)
  let records: Record<string, string>[] = [];
  if (mockMode) {
    records = mockRecords(merchant);
    log("warn", `Mock mode — ${records.length} record finti caricati`);
  } else {
    try {
      const csv = await fetchFeedCsv(feedUrl, log);
      records = parseCsv(csv);
      log("info", `Feed scaricato: ${records.length} righe raw`);
      if (records[0]) {
        log("info", "Prima riga del feed (debug shape)", {
          headers: Object.keys(records[0]),
          sample: records[0],
        });
      }
    } catch (e) {
      log("error", "Fetch/parse feed fallito", { err: (e as Error).message });
      stats.errors += 1;
      stats.duration_ms = Date.now() - startTs;
      return stats;
    }
  }

  stats.fetched = records.length;

  // 3. Cap a maxRecords
  if (records.length > maxRecords) {
    log("warn", `Cap a ${maxRecords} records (su ${records.length})`);
    records = records.slice(0, maxRecords);
  }

  // 4. Filtra: in_stock, price, has product_id + name
  const filtered = records.filter((r) => {
    const productName = r.product_name || r["aw_product_name"] || "";
    const productId = r.aw_product_id || r.merchant_product_id || "";
    if (!productName || !productId) return false;
    // in_stock: alcuni feed usano "1"/"0", altri "true"/"false", altri assenti
    const inStock = r.in_stock || r["stock_status"] || "1";
    if (inStock === "0" || inStock.toLowerCase() === "false") return false;
    const priceCents = parsePriceCents(r.search_price || r.display_price || r.price);
    if (priceCents == null || priceCents < minPriceCents) return false;
    return true;
  });
  stats.filtered = filtered.length;
  log("info", `${stats.filtered}/${stats.fetched} righe passano filtro qualita'`);

  // 5. Upsert
  for (const r of filtered) {
    try {
      const productName = r.product_name || r["aw_product_name"] || "";
      const productId = r.aw_product_id || r.merchant_product_id;
      const externalId = `awin-${merchant.awinmid}-${productId}`;
      const imageUrl = r.aw_image_url || r.merchant_image_url || null;
      const deepLink = r.aw_deep_link || r.deep_link || null;
      const description = r.description || "";
      const city = extractCity(productName, description);
      const priceCents = parsePriceCents(
        r.search_price || r.display_price || r.price || ""
      );
      const currency = (r.currency || "EUR").toUpperCase();
      const category = inferCategory(
        productName,
        r.merchant_category || "",
        merchant.defaultCategory
      );
      const tags = inferTags(`${productName} ${description}`);
      const country = (r.delivery_country || merchant.defaultCountry).toUpperCase();

      // affiliate_url_template: il deep_link Awin contiene gia' awinmid +
      // awinaffid + clickref placeholder. Sostituiamo {affiliate_id} se non
      // presente. Mai esporre la key reale qui — viene risolta runtime.
      const affiliateTemplate =
        deepLink ||
        `https://www.awin1.com/cread.php?awinmid=${merchant.awinmid}` +
          `&awinaffid={affiliate_id}&clickref={gift_id}` +
          `&ued=${encodeURIComponent(
            `https://www.vivaticket.com/it/product/${productId}`
          )}`;

      const importHash = makeImportHash({
        title: productName,
        price_min_cents: priceCents,
        city,
        image_url: imageUrl,
      });

      // Lookup esistente
      const { data: existing } = await admin
        .from("experiences")
        .select("id, source, import_hash")
        .eq("external_id", externalId)
        .maybeSingle();

      if (existing) {
        if (existing.source === "manual") {
          stats.skipped += 1;
          continue;
        }
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
            title: productName,
            description: description || null,
            image_url: imageUrl,
            external_url: deepLink || null,
            city,
            country,
            category,
            tags,
            price_min_cents: priceCents,
            currency,
            affiliate_url_template: affiliateTemplate,
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
          external_url: deepLink || null,
          title: productName,
          description: description || null,
          image_url: imageUrl,
          city,
          country,
          category,
          tags,
          price_min_cents: priceCents,
          currency,
          affiliate_url_template: affiliateTemplate,
          source: merchant.sourceTag,
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
      log("error", "Per-record exception", { err: (e as Error).message });
      stats.errors += 1;
    }
  }

  stats.duration_ms = Date.now() - startTs;
  log("info", "Import complete", { ...stats });
  return stats;
}

/**
 * Wrapper con audit row in catalog_sync_runs.
 */
export async function runAwinImportWithAudit(
  trigger: "cron" | "manual" | "api",
  merchantSlug: string,
  opts: Partial<AwinImportOptions> = {},
  triggeredBy: string | null = null
): Promise<{ run_id: string; stats: AwinImportStats }> {
  const merchant = AWIN_MERCHANTS[merchantSlug];
  if (!merchant) {
    throw new Error(`Unknown merchant slug: ${merchantSlug}`);
  }

  const admin = createSupabaseAdmin();
  const { data: run, error: runErr } = await admin
    .from("catalog_sync_runs")
    .insert({
      source: merchant.sourceTag,
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
  const log: NonNullable<AwinImportOptions["log"]> = (level, msg, ctx) => {
    logBuffer.push({ level, msg, ctx, t: new Date().toISOString() });
    // eslint-disable-next-line no-console
    console.log(`[awin-import:${merchantSlug}][${level}] ${msg}`, ctx || "");
  };

  let stats: AwinImportStats;
  try {
    stats = await importFromAwinFeed({ ...opts, merchantSlug, log });
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
          merchant: merchant.partnerSlug,
          mock_mode: stats.mock_mode,
          log: logBuffer.slice(-30),
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

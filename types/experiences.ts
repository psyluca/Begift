/**
 * Type definitions per il modulo Vendita Esperienze.
 *
 * Spec: docs/vendita-esperienze/SPEC.md
 * DB:   supabase/migrations/023_experiences_catalog.sql
 */

// ──────────────────────────────────────────────────────────────
// Enums e literal types
// ──────────────────────────────────────────────────────────────

export type ExperienceCategory =
  | "food"        // cooking class, wine tasting, food tour, ristoranti
  | "outdoor"     // trekking, kayak, bici, mare, montagna
  | "culture"     // musei, tour storico-artistici, monumenti
  | "wellness"    // spa, massaggi, yoga retreat
  | "travel"      // tour multi-giorno, esperienze viaggio
  | "gear"        // prodotti esperienziali (es. attrezzatura outdoor da regalare)
  | "music"       // concerti, festival
  | "show";       // teatro, opera, eventi performativi

export type ExperienceTag =
  // Profilo destinatario
  | "couples" | "family" | "friends" | "solo"
  // Stato d'animo / contesto
  | "romantic" | "date-night" | "adventure" | "relax"
  // Interessi specifici
  | "foodie" | "wine" | "art" | "history" | "music"
  | "hiking" | "sea" | "mountains" | "photography"
  // Caratteristiche fruizione
  | "must-see" | "hands-on" | "flexible" | "voucher"
  | "half-day" | "full-day" | "multi-day"
  // Stagionalità
  | "summer" | "winter" | "all-season"
  // Mercato
  | "international" | "local";

export type PartnerSlug = "getyourguide";

// ──────────────────────────────────────────────────────────────
// DB row types (mirror dello schema in migration 023)
// ──────────────────────────────────────────────────────────────

export interface ExperiencePartner {
  id: string;
  slug: PartnerSlug;
  display_name: string;
  base_affiliate_url: string | null;
  commission_rate: number | null;     // 0.080 = 8%
  cookie_window_days: number;
  active: boolean;
  notes: string | null;
  created_at: string;
}

export interface Experience {
  id: string;
  partner_id: string;

  external_id: string | null;
  external_url: string | null;

  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  extra_images: string[] | null;

  price_min_cents: number | null;
  price_max_cents: number | null;
  currency: string;
  commission_rate_override: number | null;

  city: string | null;
  country: string;
  category: ExperienceCategory;
  duration_minutes: number | null;
  tags: ExperienceTag[];

  rating: number | null;
  reviews_count: number;

  affiliate_url_template: string;

  active: boolean;
  curator_notes: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperienceClick {
  id: string;
  experience_id: string;
  partner_id: string;
  gift_id: string | null;
  user_id: string | null;
  ip_hash: string | null;
  ua_hash: string | null;
  tracking_id: string;
  source: ClickSource | null;
  conversion_value_cents: number | null;
  conversion_confirmed_at: string | null;
  conversion_commission_cents: number | null;
  clicked_at: string;
}

export type ClickSource =
  | "gift_open"        // click dal gift aperto dal destinatario
  | "discover_page"    // click su /discover dal sender curious
  | "create_picker"    // click dal flusso create gift (sender)
  | "draft_cross_sell" // click dal cross-sell sul draft email parser
  | "share"            // click da link condiviso fuori (FB, WA)
  | "other";

// ──────────────────────────────────────────────────────────────
// API request/response types
// ──────────────────────────────────────────────────────────────

/** Filtri per GET /api/experiences */
export interface ExperienceFilters {
  city?: string;
  category?: ExperienceCategory;
  tags?: ExperienceTag[];      // match ANY (OR), non ALL
  priceMaxCents?: number;
  priceMinCents?: number;
  limit?: number;              // default 20, max 100
  offset?: number;             // pagination
}

/** Response: lista esperienze con metadata */
export interface ExperienceListResponse {
  items: ExperienceWithPartner[];
  total: number;
  filters_applied: ExperienceFilters;
}

/** Experience con join inline su partner per UI display */
export interface ExperienceWithPartner extends Experience {
  partner: Pick<ExperiencePartner, "slug" | "display_name">;
}

/** Body per POST /api/experiences/[id]/regalo */
export interface CreateGiftFromExperienceBody {
  recipient_name: string;
  message: string;
  /** opzionale: pacchetto di packaging custom; default dal server */
  packaging_override?: unknown;
  /** opzionale: source per attribution */
  source?: ClickSource;
}

/** Response: gift creato con tracking URL pronto */
export interface CreateGiftFromExperienceResponse {
  gift_id: string;
  tracking_url: string;        // /r/{token} short link
  experience_title: string;
  partner_display_name: string;
}

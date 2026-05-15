-- ============================================================
-- Migration 023: Vendita Esperienze — Catalog tables
-- ============================================================
-- Branch: feature/email-parser-poc (da migrare a feature/vendita-esperienze)
-- Spec: docs/vendita-esperienze/SPEC.md
--
-- Aggiunge 3 tabelle per gestire il catalogo "esperienze giftabili":
--   1. experience_partners — i 3 partner affiliate attivi (GetYourGuide,
--      Awin, TradeDoubler)
--   2. experiences — record catalogo curato (titolo, prezzo, partner,
--      tracking template)
--   3. experience_clicks — log di ogni click affiliate (per attribution
--      + anti-fraud + analytics)
--
-- NOTA Supabase post 2026-10-30: nuove tabelle nello schema public
-- richiedono GRANT espliciti per essere esposte alla Data API.
-- Questa migration include i GRANT necessari per future-proofing.
--
-- Feature flag: NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP (frontend)
--               EXPERIENCES_SHOP_ENABLED (backend)
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. experience_partners
-- ──────────────────────────────────────────────────────────────
-- Catalogo dei partner affiliate. Slug e' la chiave logica usata
-- nel codice (es. "getyourguide"). Commission_rate e' indicativo
-- (le commissioni reali variano per merchant/categoria su Awin).

CREATE TABLE IF NOT EXISTS public.experience_partners (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text NOT NULL UNIQUE,           -- "getyourguide", "awin", "tradedoubler"
  display_name        text NOT NULL,
  base_affiliate_url  text,                            -- url radice del network (informativo)
  commission_rate     numeric(4,3),                    -- 0.080 = 8%, NULL se varia
  cookie_window_days  integer DEFAULT 30,
  active              boolean NOT NULL DEFAULT true,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.experience_partners IS
'Affiliate partner network attivi per BeGift. Stato 2026-05-15: GetYourGuide, Awin, TradeDoubler. Rakuten terminato.';

-- ──────────────────────────────────────────────────────────────
-- 2. experiences
-- ──────────────────────────────────────────────────────────────
-- Catalogo esperienze giftabili. Una riga = una "esperienza" che
-- BeGift puo' suggerire (tour Colosseo, cooking class Firenze, ecc.).
-- Affiliate_url_template e' specifico per riga (pre-generato in setup):
-- contiene placeholder {gift_id} che viene sostituito runtime al click.

CREATE TABLE IF NOT EXISTS public.experiences (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id              uuid NOT NULL REFERENCES public.experience_partners(id) ON DELETE RESTRICT,

  -- Identificazione lato partner (per sync API + dedup)
  external_id             text,                         -- es. GYG product ID "44519"
  external_url            text,                         -- canonical URL su partner (informativo)

  -- Contenuto presentabile
  title                   text NOT NULL,
  subtitle                text,
  description             text,                         -- markdown OK
  image_url               text,                         -- hero image (URL diretto partner CDN)
  extra_images            text[],                       -- gallery secondaria

  -- Pricing
  price_min_cents         integer,                      -- es. 4500 = €45.00
  price_max_cents         integer,                      -- per esperienze a fascia
  currency                text NOT NULL DEFAULT 'EUR',
  commission_rate_override numeric(4,3),                -- override del partner default (alcuni merchant Awin)

  -- Categorizzazione
  city                    text,                         -- "Roma", "Firenze", "Tokyo"
  country                 text DEFAULT 'IT',            -- ISO 3166-1 alpha-2
  category                text NOT NULL,                -- food, outdoor, culture, wellness, travel, gear
  duration_minutes        integer,                      -- approx duration o validity (per voucher)
  tags                    text[] NOT NULL DEFAULT '{}', -- ["foodie", "couples", "family", "romantic"]

  -- Quality signals (dai partner o curatela manuale)
  rating                  numeric(2,1),                 -- 4.7
  reviews_count           integer DEFAULT 0,

  -- Tracking
  affiliate_url_template  text NOT NULL,                -- template con {gift_id} placeholder

  -- Lifecycle
  active                  boolean NOT NULL DEFAULT true,
  curator_notes           text,                         -- nota interna ("aggiunta per Festa Mamma 2026")
  last_synced_at          timestamptz,                  -- per sync periodico (cron weekly)
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.experiences IS
'Catalogo esperienze giftabili curate (manuale + sync API partner). Vedi docs/vendita-esperienze/SPEC.md';

-- Indici per le query principali (filter discovery + lookup esterni)
CREATE INDEX IF NOT EXISTS idx_experiences_active_city
  ON public.experiences (active, city) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_experiences_active_category
  ON public.experiences (active, category) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_experiences_partner
  ON public.experiences (partner_id);
CREATE INDEX IF NOT EXISTS idx_experiences_tags_gin
  ON public.experiences USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_experiences_external
  ON public.experiences (partner_id, external_id)
  WHERE external_id IS NOT NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.experiences_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_experiences_updated_at ON public.experiences;
CREATE TRIGGER trg_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION public.experiences_set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 3. experience_clicks
-- ──────────────────────────────────────────────────────────────
-- Log di ogni click su URL affiliate. Serve per:
--  - attribution quando il partner notifica conversioni
--  - analytics BI ("quali esperienze convertono di piu'?")
--  - anti-fraud (limit per IP/giorno, prevenire click farm)
--
-- Privacy: NON salviamo IP/UA in chiaro, solo SHA-256 con salt.
-- Vedi memoria DPA Supabase per inquadramento GDPR.

CREATE TABLE IF NOT EXISTS public.experience_clicks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id   uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  partner_id      uuid NOT NULL REFERENCES public.experience_partners(id) ON DELETE RESTRICT,

  -- Contesto del click
  gift_id         uuid REFERENCES public.gifts(id) ON DELETE SET NULL,
  user_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
                    -- user_id = chi ha cliccato (di solito il destinatario,
                    -- spesso non loggato → null). Diverso dal sender che
                    -- e' gifts.creator_id.

  -- Privacy-safe identifiers
  ip_hash         text,         -- SHA-256(salt || ip), 64 char hex
  ua_hash         text,         -- SHA-256(salt || user_agent), 64 char hex

  -- Tracking attribution
  tracking_id     text NOT NULL,  -- token passato al partner (cmp=...)
  source          text,           -- "gift_open", "discover_page", "create_picker"

  -- Stato attribution
  conversion_value_cents integer, -- se il partner conferma conversione
  conversion_confirmed_at timestamptz,
  conversion_commission_cents integer,

  clicked_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.experience_clicks IS
'Log click affiliate per attribution + analytics. IP/UA hashed per GDPR.';

CREATE INDEX IF NOT EXISTS idx_experience_clicks_experience
  ON public.experience_clicks (experience_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_experience_clicks_gift
  ON public.experience_clicks (gift_id) WHERE gift_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_experience_clicks_tracking
  ON public.experience_clicks (tracking_id);
CREATE INDEX IF NOT EXISTS idx_experience_clicks_ip_recent
  ON public.experience_clicks (ip_hash, clicked_at DESC)
  WHERE clicked_at > (now() - interval '1 day');
  -- ^ partial index per anti-fraud check rapido (ultime 24h)

-- ──────────────────────────────────────────────────────────────
-- RLS — Row Level Security
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.experience_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_clicks   ENABLE ROW LEVEL SECURITY;

-- experience_partners: lettura pubblica (info pubblica), scrittura admin
CREATE POLICY "experience_partners read public"
  ON public.experience_partners FOR SELECT
  USING (true);

-- experiences: lettura pubblica (solo active), scrittura admin
CREATE POLICY "experiences read public active"
  ON public.experiences FOR SELECT
  USING (active = true);

-- experience_clicks: NESSUN accesso pubblico (analytics interno)
-- Insert via service_role (server-side endpoint). Read solo admin.
-- Nessuna policy = nessun accesso via anon/authenticated.

-- ──────────────────────────────────────────────────────────────
-- GRANT per Data API (Supabase post 2026-10-30 policy)
-- ──────────────────────────────────────────────────────────────

GRANT SELECT ON public.experience_partners TO anon, authenticated;
GRANT SELECT ON public.experiences         TO anon, authenticated;
-- experience_clicks: nessun grant a anon/authenticated (solo service_role
-- via admin client server-side)

-- Sequenze (auto se gen_random_uuid, ma future-proof per eventuali serial)
-- Non servono per UUID generati con gen_random_uuid().

-- ──────────────────────────────────────────────────────────────
-- Seed iniziale partner (non duplica se esistono gia')
-- ──────────────────────────────────────────────────────────────

INSERT INTO public.experience_partners (slug, display_name, base_affiliate_url, commission_rate, cookie_window_days, active)
VALUES
  ('getyourguide',  'GetYourGuide',  'https://www.getyourguide.com', 0.080, 31, true),
  ('awin',          'Awin Network',  'https://www.awin1.com',         NULL,  30, true),
  ('tradedoubler',  'TradeDoubler',  'https://clk.tradedoubler.com',  NULL,  30, true)
ON CONFLICT (slug) DO NOTHING;

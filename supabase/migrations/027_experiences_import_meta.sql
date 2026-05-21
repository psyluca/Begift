-- ============================================================
-- Migration 027: Experiences import metadata
-- ============================================================
-- Branch: feature/catalog-import
-- Data: 2026-05-21
--
-- Aggiunge il minimo indispensabile per supportare l'import
-- automatizzato del catalogo GetYourGuide (Partner API).
--
-- Decisioni di design:
--
-- 1. `source` (text). Distinguere righe inserite a mano (seed manuale
--    o curatela editoriale) da righe importate via API. Permette di:
--      - filtrare/eliminare in massa le righe importate senza toccare
--        la curatela manuale ("Vasco Live", "Milan-Juventus", ecc.)
--      - sapere quale flusso ha generato una riga in caso di anomalia
--    Default 'manual' per compatibilita' retroattiva con righe esistenti.
--
-- 2. `import_hash` (text). SHA-256 di (title + price + city + image_url).
--    Usato in upsert per evitare UPDATE inutile quando il record non e'
--    cambiato: l'importer calcola l'hash dal feed e se coincide con
--    quello su DB skippa l'UPDATE (riduce write su Supabase + latency).
--
-- 3. Index su `source`. Tutte le query di ordine massivo
--    (purge import, stats, dashboard admin) filtrano per source.
--    Partial index sul valore non-manual perche' i record manuali
--    sono pochi e non hanno bisogno di indice dedicato.
--
-- Idempotente: i comandi sono tutti ADD COLUMN IF NOT EXISTS.
-- ============================================================

BEGIN;

-- 1. Colonna source
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

COMMENT ON COLUMN public.experiences.source IS
'Origine del record: ''manual'' (curatela), ''imported_gyg_api'' (cron GYG Partner API), ''imported_awin_feed'' (futuro fallback Awin product feed).';

-- 2. Colonna import_hash
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS import_hash text;

COMMENT ON COLUMN public.experiences.import_hash IS
'SHA-256 hash dei campi serializzabili dal feed (title, price, city, image). Usato dall''importer per skippare UPDATE no-op.';

-- 3. Index su source per query di amministrazione (purge, stats, ecc.)
CREATE INDEX IF NOT EXISTS idx_experiences_source
  ON public.experiences (source)
  WHERE source != 'manual';

-- 4. Tabella di audit delle sync run (utile per dashboard admin + debug)
CREATE TABLE IF NOT EXISTS public.catalog_sync_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source          text NOT NULL,                  -- 'gyg_api', 'awin_feed', ecc.
  trigger         text NOT NULL,                  -- 'cron', 'manual', 'api'
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  status          text NOT NULL DEFAULT 'running', -- 'running', 'success', 'partial', 'error'
  fetched         integer DEFAULT 0,
  filtered        integer DEFAULT 0,
  inserted        integer DEFAULT 0,
  updated         integer DEFAULT 0,
  skipped         integer DEFAULT 0,
  errors          integer DEFAULT 0,
  error_message   text,
  duration_ms     integer,
  notes           jsonb,                          -- pages fetched, query params, ecc.
  triggered_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.catalog_sync_runs IS
'Audit log di ogni sync run del catalogo (cron e manual). Permette di vedere a colpo d''occhio l''ultima sync, troubleshoot errori, e verificare che il cron giri.';

CREATE INDEX IF NOT EXISTS idx_catalog_sync_runs_recent
  ON public.catalog_sync_runs (started_at DESC);

-- RLS: solo service_role (admin client server-side). Niente accesso pubblico.
ALTER TABLE public.catalog_sync_runs ENABLE ROW LEVEL SECURITY;
-- Nessuna policy = nessun accesso via anon/authenticated.

-- GRANT espliciti per Data API (post 2026-10-30 Supabase policy).
-- Nota: catalog_sync_runs NON ha GRANT a anon/authenticated perche'
-- contiene metadati operativi che non vogliamo esposti pubblicamente.

COMMIT;

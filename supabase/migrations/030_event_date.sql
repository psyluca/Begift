-- ============================================================
-- Migration 030: event_date per nascondere esperienze scadute
-- ============================================================
-- 2026-06-04
--
-- Aggiunge campo `event_date` (date NULL) alla tabella `experiences`.
-- Pensato per i concerti/eventi VivaTicket con data singola (es.
-- "Vasco Live 2026 — 22 giugno 2026"). Eventi con data passata
-- vengono nascosti dal catalogo via filtro at query-time:
--
--   WHERE event_date IS NULL OR event_date >= CURRENT_DATE
--
-- Tutte le esperienze evergreen (GYG tour, GYG cooking class,
-- regali fisici 24Bottles, eventi VVT multi-data tipo "sedi varie")
-- hanno event_date = NULL e restano sempre visibili.
--
-- Backfill da curator_notes (campo testuale che contiene "Data
-- evento: gg/mm/aaaa" per molti VVT importati): vedi
-- supabase/backfill_event_dates_2026-06-04.sql (script one-shot).
--
-- Decisione 2026-06-04 (Luca + Claude): opzione A — mostriamo
-- l'esperienza fino a tutto il giorno dell'evento incluso. La
-- regola e' `event_date >= CURRENT_DATE`, quindi un concerto
-- del 4 giugno e' visibile per tutto il 4 giugno e sparisce il 5.
-- ============================================================

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS event_date date;

COMMENT ON COLUMN public.experiences.event_date IS
'Data singola dell''evento (solo VVT eventi con data fissa). NULL = sempre visibile (evergreen). Filtro auto-hide: event_date IS NULL OR event_date >= CURRENT_DATE.';

-- Indice per il filtro at query-time del catalogo.
-- Posizionato su (event_date) perche' la query del catalogo fa
-- "WHERE active = true AND is_physical_gift != true AND
--  (event_date IS NULL OR event_date >= CURRENT_DATE)" e ordina
-- per rating/reviews_count. Partial index su event_date NOT NULL
-- ridurrebbe la size ma rovinerebbe la query con OR; meglio
-- indice completo.
CREATE INDEX IF NOT EXISTS experiences_event_date_idx
  ON public.experiences (event_date)
  WHERE active = true;

-- GRANT espliciti per Data API (policy Supabase 2026-10-30, vedi
-- project_begift_supabase_grants_oct2026.md).
-- ALTER TABLE non richiede nuovi GRANT (la colonna eredita).

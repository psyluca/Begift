-- ============================================================
-- BeGift — Migration 013: gift template type + structured data
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Aggiunge due colonne alla tabella gifts per supportare i nuovi
-- "template" speciali (es. la "Lettera che cresce" della Festa
-- della Mamma) che richiedono una pagina di apertura dedicata,
-- diversa dal flusso classico contenuto+packaging.
--
-- Schema:
-- - template_type: stringa che identifica il template speciale.
--   Se NULL il gift e' un gift "classico" (content_type-based,
--   compleanno, anniversario, ecc.). Se valorizzato, il client
--   GiftOpeningClient renderizza un componente dedicato in base
--   al valore. Esempi: 'mothers_day_letter', 'fathers_day_letter',
--   'graduation_album', ecc. (tutti aggiunti in futuro).
-- - template_data: payload JSON con i campi strutturati specifici
--   del template. Per mothers_day_letter:
--     {
--       "word": "Forte",
--       "memory": "...",
--       "lesson": "...",
--       "song_url": "https://open.spotify.com/...",
--       "voucher_url": "https://..." (opzionale)
--     }
--
-- IDEMPOTENTE.
-- ============================================================

alter table public.gifts
  add column if not exists template_type text,
  add column if not exists template_data jsonb default '{}'::jsonb;

-- Index per query future "quanti regali del template X?"
-- Parziale: solo dove template_type e' valorizzato (la maggioranza
-- dei gift sara' senza template, niente senso indicizzare null).
create index if not exists gifts_template_type_idx
  on public.gifts(template_type)
  where template_type is not null;

-- Sanity check post-migration:
-- select template_type, count(*) from public.gifts
-- where template_type is not null group by template_type;

-- ============================================================
-- BeGift — Migration 016: extra_media JSONB su gifts
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Permette di allegare PIU' di una foto/video a un singolo regalo
-- (es. album di un viaggio o di un evento). Il campo content_url
-- esistente continua a esistere e tenere il media "primario"
-- (compatibilita' all'indietro): extra_media e' una array opzionale
-- di oggetti aggiuntivi {url, kind} oltre al primario.
--
-- Schema atteso del JSON:
--   [
--     { "url": "https://.../foo.jpg", "kind": "image" },
--     { "url": "https://.../bar.jpg", "kind": "image" },
--     ...
--   ]
--
-- Limiti applicativi: il client limita a max 9 elementi (max 10
-- foto totali contando il content_url primario). Il DB non impone
-- un limite hard ma 9 e' un compromesso per non gonfiare le righe.
--
-- IDEMPOTENTE.
-- ============================================================

alter table public.gifts
  add column if not exists extra_media jsonb default '[]'::jsonb;

-- Sanity check post-migration:
-- select id, recipient_name, jsonb_array_length(extra_media) as media_count
-- from public.gifts
-- where extra_media is not null and jsonb_array_length(extra_media) > 0
-- order by created_at desc limit 10;

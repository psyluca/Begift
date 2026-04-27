-- ============================================================
-- BeGift — Migration 018: Email campaigns idempotency
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Aggiunge una colonna `email_campaigns_sent` su profiles per
-- tracciare quali campagne email "one-shot" sono state inviate a
-- quell'utente. Permette di:
--
--  - Rispedire la stessa campagna senza inviarla due volte
--  - Targetizzare future campagne (es. "tutti gli utenti che NON
--    hanno ricevuto la campagna festa_mamma_2026")
--  - Mantenere uno storico semplice per audit
--
-- Schema atteso del JSON:
--   {
--     "festa_mamma_2026": "2026-04-27T10:30:00Z",
--     "lancio_2026": "..."
--   }
--
-- Chiavi = id univoco campagna (slug stabile, mai riusato).
-- Valori = ISO timestamp dell'invio.
--
-- Niente tabella separata: per il volume di utenti previsto in beta
-- (<5000 nei primi 6 mesi) un campo JSON sui profiles e' piu' che
-- sufficiente. Se in futuro si scala a 100k+ utenti e si fanno 50+
-- campagne all'anno, varra' la pena estrarre in una tabella
-- email_campaigns + email_campaign_recipients.
--
-- IDEMPOTENTE.
-- ============================================================

alter table public.profiles
  add column if not exists email_campaigns_sent jsonb not null default '{}'::jsonb;

-- Index GIN per query veloci tipo "tutti gli utenti che NON hanno
-- ricevuto la campagna X" (where not (email_campaigns_sent ? 'x')).
create index if not exists idx_profiles_email_campaigns_sent
  on public.profiles using gin (email_campaigns_sent);

-- Sanity check post-migration:
-- select count(*) from public.profiles
--   where email_campaigns_sent ? 'festa_mamma_2026';

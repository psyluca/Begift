-- ============================================================
-- BeGift — Migration 011: Referral tracking
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Tracking del referrer (chi ha portato chi).
-- - profiles.referred_by_username: handle del referrer (testo, non FK
--   perché l'handle può cambiare nel tempo e vogliamo congelarlo).
--   Settato una sola volta al signup tramite query param ?ref=@handle
--   memorizzato in localStorage/cookie.
-- - profiles.referred_by_user_id: FK al profilo referrer per query
--   stabili. Risolto server-side lookup al signup.
-- - profiles.referral_source: testo opzionale libero per future
--   fonti (es. 'utm_source=instagram').
--
-- Base giuridica: legittimo interesse (anti-abuse + growth analytics).
-- Coperto dalla Privacy Policy esistente.
--
-- IDEMPOTENTE.
-- ============================================================

alter table public.profiles
  add column if not exists referred_by_username text,
  add column if not exists referred_by_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists referral_source text,
  add column if not exists referred_at timestamptz;

-- Indice per query "quanti mi ha portato @X?"
create index if not exists profiles_referred_by_user_id_idx
  on public.profiles(referred_by_user_id)
  where referred_by_user_id is not null;

-- Sanity check:
-- select referred_by_user_id, count(*) from public.profiles
--   where referred_by_user_id is not null
--   group by referred_by_user_id;

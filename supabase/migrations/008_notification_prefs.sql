-- ============================================================
-- BeGift — Migration 008: Notification preferences
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Aggiunge 3 colonne booleane su profiles per il controllo
-- granulare delle notifiche push:
--
--   notify_gift_received — qualcuno ti ha mandato un regalo
--   notify_gift_opened   — il destinatario ha aperto un tuo regalo
--   notify_reaction      — qualcuno ha reagito a un tuo regalo
--
-- Tutte default TRUE: il comportamento at-scale è "ricevi tutto",
-- l'utente può spegnere singole categorie da /settings.
--
-- I controlli avvengono server-side in webPush.ts prima di
-- sendNotification: se la pref è false, skip. Questo evita di
-- inviare push che il client poi butta via.
--
-- IDEMPOTENTE.
-- ============================================================

alter table public.profiles
  add column if not exists notify_gift_received boolean not null default true,
  add column if not exists notify_gift_opened   boolean not null default true,
  add column if not exists notify_reaction      boolean not null default true;

-- Backfill per utenti esistenti pre-migration (in realtà il default
-- gestisce già ma lo scriviamo esplicito per chiarezza)
update public.profiles
  set notify_gift_received = true
  where notify_gift_received is null;
update public.profiles
  set notify_gift_opened = true
  where notify_gift_opened is null;
update public.profiles
  set notify_reaction = true
  where notify_reaction is null;

-- Sanity check:
-- select count(*), notify_gift_received, notify_gift_opened, notify_reaction
--   from public.profiles
--   group by notify_gift_received, notify_gift_opened, notify_reaction;

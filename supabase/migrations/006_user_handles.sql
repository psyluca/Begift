-- ============================================================
-- BeGift — Migration 006: Username univoci (@handle)
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Ogni utente sceglie uno username/handle univoco alla prima
-- apertura dell'app (modal di onboarding obbligatoria). Il handle
-- è immutabile nel formato ma cambiabile dal profilo settings.
--
-- Regole del handle:
--   - Lunghezza 3-20 caratteri
--   - Solo lowercase a-z, cifre 0-9, underscore _
--   - Niente spazi, niente maiuscole, niente caratteri speciali,
--     niente emoji. Stile Twitter/X.
--   - Univoco case-insensitive (ma storato lowercase per coerenza).
--   - NULL = ancora non impostato (nuovo utente, da forzare con
--     modal all'avvio)
--
-- IDEMPOTENTE: riesecuzioni multiple non fanno male.
-- ============================================================

-- Aggiungi la colonna (nullable inizialmente — gli utenti esistenti
-- dovranno sceglierla alla prossima apertura, non si può forzare
-- valore backfill senza scegliere uno handle unico per ciascuno).
alter table public.profiles
  add column if not exists username text;

-- Check constraint: regex + lunghezza. Solo lowercase/cifre/_
-- Usiamo un DO block per evitare duplicati se già esiste.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_username_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (username is null or username ~ '^[a-z0-9_]{3,20}$');
  end if;
end $$;

-- Unique index case-insensitive (anche se la colonna è già lowercase
-- per check constraint, usiamo lower() per robustezza).
create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

-- Indice plain per lookup veloce @handle → profile (usato da
-- future feature: search user, mention, ecc.)
create index if not exists profiles_username_idx
  on public.profiles (username)
  where username is not null;

-- RLS: la policy "profiles: own read" esistente permette solo di
-- leggere il PROPRIO profilo. Per permettere ad altri utenti di
-- vedere l'handle (utile per mention, chat, mostrare il sender in
-- una gift card), aggiungiamo una policy che espone SOLO i campi
-- pubblici (id, username, display_name, avatar_url) — NON l'email.
-- Ma in Postgres RLS è tutto-o-niente per row, quindi aprire la
-- lettura su profiles espone anche l'email.
--
-- Compromesso: NON aggiungiamo policy pubblica qui. La chat e la
-- UI del gift usano il service_role via server endpoints dedicati
-- (come fa già handle_new_user) per fetchare i dati pubblici che
-- servono, senza esporre email.

-- Sanity check (decommentare per eseguire):
-- select count(*), count(username) as with_handle from public.profiles;

-- ============================================================
-- BeGift — Migration 012: gift_opens (formalizzazione + colonne mancanti)
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Questa migration formalizza la tabella gift_opens che fino al
-- 2026-04-25 era stata creata manualmente nel dashboard Supabase
-- (schema drift). La tabella esiste gia' con qualche colonna ma
-- POTREBBE NON avere device_id (motivo per cui il dedupe non
-- funziona e l'INSERT da API fallisce per "column does not exist").
--
-- La migration:
-- 1) CREATE TABLE IF NOT EXISTS (no-op se esiste)
-- 2) ALTER TABLE ADD COLUMN IF NOT EXISTS per ogni colonna richiesta
-- 3) Indici e UNIQUE constraint
-- 4) RLS + 4 policy esplicite
--
-- IDEMPOTENTE: e' sicuro eseguirla anche piu' volte.
-- ============================================================

-- 1) Tabella se non esiste con tutte le colonne corrette.
create table if not exists public.gift_opens (
  id          uuid primary key default gen_random_uuid(),
  gift_id     uuid not null references public.gifts(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  device_id   text,
  opened_at   timestamptz default now() not null
);

-- 2) Se la tabella gia' esisteva con uno schema parziale, aggiungiamo
--    le colonne mancanti. ADD COLUMN IF NOT EXISTS e' supportato da
--    Postgres 9.6+, quindi va bene su Supabase.
alter table public.gift_opens
  add column if not exists device_id text;
alter table public.gift_opens
  add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.gift_opens
  add column if not exists opened_at timestamptz default now() not null;

-- 3) Indici. Drop+create per essere sicuri che usino le colonne corrette.
create index if not exists gift_opens_gift_id_idx
  on public.gift_opens(gift_id);
create index if not exists gift_opens_user_id_idx
  on public.gift_opens(user_id) where user_id is not null;

-- Unique parziale: dedupe per (gift_id, device_id) solo quando
-- device_id e' valorizzato. Se device_id e' null (privacy mode,
-- cookie disabilitati), permettiamo aperture multiple — edge case raro.
drop index if exists gift_opens_gift_device_unique_idx;
create unique index gift_opens_gift_device_unique_idx
  on public.gift_opens(gift_id, device_id) where device_id is not null;

-- 4) RLS abilitata + policy esplicite.
alter table public.gift_opens enable row level security;

-- POLICY 1: chiunque puo' INSERIRE un'apertura. Coerente col fatto
-- che il link gift e' pubblico e l'apertura e' un evento volontario
-- del visitatore (anche anonimo). L'API /api/gift-opens usa comunque
-- service_role per garantire la scrittura.
drop policy if exists "gift_opens: public insert" on public.gift_opens;
create policy "gift_opens: public insert"
  on public.gift_opens for insert
  with check (true);

-- POLICY 2: il creator del gift puo' leggere le aperture dei propri
-- regali (per il contatore "aperto N volte" nella dashboard).
drop policy if exists "gift_opens: creator can read" on public.gift_opens;
create policy "gift_opens: creator can read"
  on public.gift_opens for select
  using (
    exists (
      select 1 from public.gifts g
      where g.id = gift_opens.gift_id
        and g.creator_id = auth.uid()
    )
  );

-- POLICY 3: l'utente puo' leggere le proprie aperture (gift altrui
-- che ho aperto io). Necessario per il tab "Ricevuti".
drop policy if exists "gift_opens: own user_id read" on public.gift_opens;
create policy "gift_opens: own user_id read"
  on public.gift_opens for select
  using (user_id = auth.uid());

-- POLICY 4: l'utente puo' cancellare le proprie aperture (per
-- nascondere un gift dalla lista "Ricevuti").
drop policy if exists "gift_opens: own user_id delete" on public.gift_opens;
create policy "gift_opens: own user_id delete"
  on public.gift_opens for delete
  using (user_id = auth.uid());

-- ============================================================
-- Sanity check post-migration:
--
-- 1. Schema:
--    select column_name, data_type, is_nullable
--    from information_schema.columns
--    where table_schema = 'public' and table_name = 'gift_opens'
--    order by ordinal_position;
--    -- atteso: id, gift_id, user_id, device_id, opened_at
--
-- 2. Policy attive:
--    select policyname, cmd from pg_policies
--    where schemaname = 'public' and tablename = 'gift_opens';
--    -- atteso: 4 policy (public insert, creator read, own read, own delete)
--
-- 3. Conteggi:
--    select count(*) from public.gift_opens;
-- ============================================================

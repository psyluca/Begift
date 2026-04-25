-- ============================================================
-- BeGift — Migration 012: gift_opens (formalizzazione)
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Questa migration formalizza la tabella gift_opens che fino al
-- 2026-04-25 era stata creata manualmente nel dashboard Supabase
-- (schema drift). La definizione qui rispecchia lo stato attuale e
-- aggiunge le RLS necessarie.
--
-- Scopo della tabella:
-- - Tracciare ogni apertura di un regalo da parte di un destinatario
-- - Decidere se mandare la push "il tuo regalo e' stato aperto"
--   al creator (solo alla PRIMA apertura, identificata dal count == 0)
-- - Mostrare nel dashboard del creator "aperto il GG/MM/YYYY"
-- - Statistiche aggregate (admin/stats)
--
-- Dedupe: chiave logica (gift_id, device_id). Se il device riapre il
-- regalo, niente nuova riga (senza gonfiare il contatore). Se device_id
-- e' null (es. browser senza localStorage / privacy mode), ogni
-- apertura crea una nuova riga — accettabile, edge case raro.
--
-- IDEMPOTENTE.
-- ============================================================

create table if not exists public.gift_opens (
  id          uuid primary key default gen_random_uuid(),
  gift_id     uuid not null references public.gifts(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  -- device_id: identificatore opaco generato lato client e salvato in
  -- localStorage. Permette dedupe senza richiedere login. Se null,
  -- l'apertura viene comunque registrata.
  device_id   text,
  opened_at   timestamptz default now() not null
);

create index if not exists gift_opens_gift_id_idx
  on public.gift_opens(gift_id);
create index if not exists gift_opens_user_id_idx
  on public.gift_opens(user_id) where user_id is not null;
-- Dedupe parziale: unique solo quando device_id e' valorizzato.
create unique index if not exists gift_opens_gift_device_unique_idx
  on public.gift_opens(gift_id, device_id) where device_id is not null;

alter table public.gift_opens enable row level security;

-- POLICY 1: chiunque puo' INSERIRE un'apertura. Coerente col fatto
-- che il link gift e' pubblico e l'apertura e' un evento volontario
-- del visitatore (anche anonimo). Il dedupe per device_id evita abusi.
-- L'API /api/gift-opens usa comunque service_role per garantire la
-- scrittura anche in caso di RLS bug futuri.
drop policy if exists "gift_opens: public insert" on public.gift_opens;
create policy "gift_opens: public insert"
  on public.gift_opens for insert
  with check (true);

-- POLICY 2: il creator del gift puo' leggere le aperture dei propri
-- regali. Si controlla via JOIN con la tabella gifts.
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
-- che ho aperto io). Necessario per il tab "Ricevuti" nel dashboard.
drop policy if exists "gift_opens: own user_id read" on public.gift_opens;
create policy "gift_opens: own user_id read"
  on public.gift_opens for select
  using (user_id = auth.uid());

-- POLICY 4: l'utente puo' cancellare le proprie aperture (per nascondere
-- un gift dalla lista "Ricevuti"). Solo dove user_id matcha.
drop policy if exists "gift_opens: own user_id delete" on public.gift_opens;
create policy "gift_opens: own user_id delete"
  on public.gift_opens for delete
  using (user_id = auth.uid());

-- Sanity check post-migration:
-- select count(*) from public.gift_opens;
-- select g.recipient_name, count(o.id) as opens
-- from public.gifts g
-- left join public.gift_opens o on o.gift_id = g.id
-- where g.creator_id = auth.uid()
-- group by g.id, g.recipient_name
-- order by g.created_at desc;

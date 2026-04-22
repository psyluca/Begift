-- ============================================================
-- BeGift — Migration 005: Web Push subscriptions
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Persiste le sottoscrizioni Web Push dei browser/PWA utente.
-- Ogni browser/device su cui l'utente ha accettato le notifiche
-- crea una nuova riga con il suo endpoint + chiavi crittografiche
-- (p256dh, auth). Quando il server deve inviare una notifica push
-- a uno specifico utente, legge TUTTE le sue righe e fa send a
-- ciascun endpoint.
--
-- L'endpoint push è univoco per device; se la stessa installazione
-- si re-sottoscrive (es. cambio permesso, clear site data), il
-- browser emette un nuovo endpoint ma anche un nuovo record — il
-- vecchio endpoint diventa invalido e viene pulito al primo 410
-- Gone restituito dal push service (gestito lato /api/push/send).
--
-- RLS: ogni utente legge/scrive solo le proprie sottoscrizioni.
-- Il server che invia push usa il service_role per leggere tutti
-- gli endpoint di un user_id (bypassando RLS).
--
-- IDEMPOTENTE: riesecuzioni multiple non fanno male.
-- ============================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  -- User agent snapshot per debug ("iPhone Safari PWA", "Chrome desktop")
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  -- Uno stesso endpoint non può essere salvato più volte
  unique (endpoint)
);

-- Indice per query "dammi tutti gli endpoint di questo utente"
create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id);

-- RLS
alter table public.push_subscriptions enable row level security;

-- Drop eventuali policy precedenti (per rerun idempotente)
drop policy if exists "push_subs: user read own" on public.push_subscriptions;
drop policy if exists "push_subs: user insert own" on public.push_subscriptions;
drop policy if exists "push_subs: user delete own" on public.push_subscriptions;

-- L'utente legge solo le proprie sottoscrizioni
create policy "push_subs: user read own"
  on public.push_subscriptions for select
  using (user_id = auth.uid());

-- L'utente inserisce solo sottoscrizioni per se stesso
create policy "push_subs: user insert own"
  on public.push_subscriptions for insert
  with check (user_id = auth.uid());

-- L'utente può cancellare le proprie sottoscrizioni (es. al logout
-- o "disabilita notifiche")
create policy "push_subs: user delete own"
  on public.push_subscriptions for delete
  using (user_id = auth.uid());

-- Il server (service_role) può fare tutto, inclusa la pulizia di
-- endpoint scaduti. Service_role bypassa RLS automaticamente,
-- non serve policy esplicita.

-- Sanity check (decommentare per eseguire):
-- select count(*), user_id from public.push_subscriptions group by user_id;

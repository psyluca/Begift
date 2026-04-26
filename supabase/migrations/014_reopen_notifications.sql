-- ============================================================
-- BeGift — Migration 014: reopen_notifications (dedupe)
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Tabella di supporto per il cron /api/cron/reopen-notifications.
-- Tracciamo quale tier (3, 5, 10 aperture) di push relazionale e'
-- gia' stato mandato per ogni (gift_id, tier), in modo da non
-- spedire la stessa notifica due volte.
--
-- IDEMPOTENTE.
-- ============================================================

create table if not exists public.reopen_notifications (
  gift_id uuid not null references public.gifts(id) on delete cascade,
  tier    int  not null check (tier in (3, 5, 10)),
  sent_at timestamptz default now() not null,
  primary key (gift_id, tier)
);

-- RLS: la tabella e' di servizio, accessibile SOLO via service_role
-- (cron job). Niente accessi pubblici/utente.
alter table public.reopen_notifications enable row level security;

-- Sanity:
-- select gift_id, tier, sent_at from public.reopen_notifications
--   order by sent_at desc limit 20;

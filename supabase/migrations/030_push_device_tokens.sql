-- ============================================================
-- BeGift — Migration 030: Native push device tokens (APNs/FCM)
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Persiste i device token per push native iOS (APNs) e Android (FCM).
-- Separata da push_subscriptions (web push PWA) perché lo shape del
-- token è strutturalmente diverso:
--   - APNs token: stringa hex 64 char (es. 'a1b2c3d4...')
--   - FCM token: stringa più lunga (~150-200 char)
--   - Web Push: oggetto {endpoint, p256dh, auth}
--
-- Quando il server deve inviare push a un utente, legge entrambe le
-- tabelle e fa fanout su tutti i suoi device (web + native).
--
-- IDEMPOTENTE: riesecuzioni multiple non fanno male.
-- ============================================================

create table if not exists public.push_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  unique (token)
);

create index if not exists push_device_tokens_user_id_idx
  on public.push_device_tokens(user_id);

alter table public.push_device_tokens enable row level security;

drop policy if exists "push_dev: user read own" on public.push_device_tokens;
drop policy if exists "push_dev: user insert own" on public.push_device_tokens;
drop policy if exists "push_dev: user delete own" on public.push_device_tokens;

create policy "push_dev: user read own"
  on public.push_device_tokens for select
  using (user_id = auth.uid());

create policy "push_dev: user insert own"
  on public.push_device_tokens for insert
  with check (user_id = auth.uid());

create policy "push_dev: user delete own"
  on public.push_device_tokens for delete
  using (user_id = auth.uid());

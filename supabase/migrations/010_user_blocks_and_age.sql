-- ============================================================
-- BeGift — Migration 010: User blocks + age confirmation
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- 1. age_confirmed_at su profiles — timestamp conferma età (GDPR
--    art. 8: minimo 16 anni UE). NULL = utente deve ancora confermare,
--    mostrato il modal di onboarding con checkbox età.
--
-- 2. user_blocks — relazioni A blocca B per anti-harassment.
--    Quando A blocca B:
--      - A non riceve più push per gift/reazioni di B
--      - Se A è loggato e visita /gift/[id] creato da B, puo
--        vedere il regalo (il link è pubblico), ma la gift-chain
--        CTA e la chat sono nascoste
--      - B può ancora mandare gift ad A (link pubblico), ma A
--        non li vedrà in "Ricevuti" (filter app-level)
--
-- IDEMPOTENTE.
-- ============================================================

-- 1. AGE CONFIRMATION ─────────────────────────────────────────
alter table public.profiles
  add column if not exists age_confirmed_at timestamptz;

-- 2. USER BLOCKS ──────────────────────────────────────────────
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocker_idx on public.user_blocks(blocker_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);

alter table public.user_blocks enable row level security;

drop policy if exists "user_blocks: own read" on public.user_blocks;
drop policy if exists "user_blocks: own insert" on public.user_blocks;
drop policy if exists "user_blocks: own delete" on public.user_blocks;

create policy "user_blocks: own read"
  on public.user_blocks for select
  using (blocker_id = auth.uid());

create policy "user_blocks: own insert"
  on public.user_blocks for insert
  with check (blocker_id = auth.uid());

create policy "user_blocks: own delete"
  on public.user_blocks for delete
  using (blocker_id = auth.uid());

-- Sanity:
-- select count(*) from public.user_blocks;
-- select count(age_confirmed_at) as confirmed, count(*) as total from public.profiles;

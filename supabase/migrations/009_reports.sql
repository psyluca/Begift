-- ============================================================
-- BeGift — Migration 009: Report/Abuse mechanism
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Tabella per ricevere segnalazioni di contenuti inappropriati,
-- requisito DSA (Digital Services Act) art. 16 "notice and action
-- mechanism" per ogni piattaforma digitale.
--
-- Chiunque (anche utenti non loggati) può inserire una segnalazione
-- visitando una pagina /gift/[id]. Il reporter_user_id è nullable
-- per accettare segnalazioni anonime. Se loggato, lo tracciamo
-- per follow-up + anti-spam.
--
-- Status workflow:
--   pending   → appena creato, da rivedere
--   reviewing → admin lo sta valutando
--   resolved  → rimozione effettuata / azione presa
--   dismissed → segnalazione infondata, chiusa
--
-- Categorie standard (DSA allineate):
--   illegal        — contenuto illegale (CSAM, violenza, terrorismo)
--   disturbing     — disturbante (violenza grafica, autolesionismo)
--   spam           — spam/abuso piattaforma
--   copyright      — violazione copyright
--   privacy        — pubblicazione dati personali senza consenso
--   other          — altro
--
-- IDEMPOTENTE.
-- ============================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete cascade,
  reporter_user_id uuid references auth.users(id) on delete set null,
  category text not null check (category in (
    'illegal', 'disturbing', 'spam', 'copyright', 'privacy', 'other'
  )),
  description text,
  -- IP + user agent del reporter per anti-abuse (es. troll che
  -- spammano segnalazioni false). Consentiti da GDPR per legittimo
  -- interesse "prevenzione abusi".
  reporter_ip text,
  reporter_ua text,
  status text not null default 'pending' check (status in (
    'pending', 'reviewing', 'resolved', 'dismissed'
  )),
  admin_notes text,
  reviewed_at timestamptz,
  reviewer_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Indici
create index if not exists reports_status_idx on public.reports(status, created_at desc);
create index if not exists reports_gift_id_idx on public.reports(gift_id);
create index if not exists reports_reporter_idx on public.reports(reporter_user_id)
  where reporter_user_id is not null;

-- RLS
alter table public.reports enable row level security;

drop policy if exists "reports: anyone insert" on public.reports;
drop policy if exists "reports: reporter read own" on public.reports;

-- Chiunque può inserire un report (anche non loggati). Campo
-- reporter_user_id verrà popolato server-side se c'è session
-- valida, altrimenti resta null.
create policy "reports: anyone insert"
  on public.reports for insert
  with check (true);

-- L'utente può leggere solo le proprie segnalazioni (follow-up
-- lato client futuro). Admin bypassa RLS via service_role.
create policy "reports: reporter read own"
  on public.reports for select
  using (reporter_user_id = auth.uid());

-- Sanity check:
-- select count(*), status from public.reports group by status;
